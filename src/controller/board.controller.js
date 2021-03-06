import { BoardModel } from "../model/board.model.js";
import { signToken, decodeToken, tokenOptions } from '../utils/jwt.js';

const { boardList, boardView, boardWrite, boardUpdate, boardDelete } = BoardModel;
const validate = {
    write: ['subject', 'content'],
    update: ['subject', 'content', 'idx']
};

export class BoardController {
    constructor() {}

    static async boardList(req, res) {
        const response = await boardList(req.query);

        res.json(response);
    }

    static async boardView(req, res) {
        const { idx } = req.params;
        const response = await boardView({ idx });

        res.json(response);
    }

    static async boardWrite(req, res) {
        for (const data of validate.write) {
            if (!req.body[data]) {
                res.status(400).send({ error: `${data} is required.` });

                return;
            }
        }

        const { token } = req.cookies;
        const { userIdx, name, email, id } = decodeToken(token);
        const { subject, content } = req.body;
        const { insertId } = await boardWrite({
            writer: name,
            userIdx,
            subject,
            content
        });
        const resetToken = signToken({ id, name, email, userIdx });

        res.cookie('token', resetToken, tokenOptions);
        res.json({ insertId });
    }

    static async boardUpdate(req, res) {
        for (const data of validate.update) {
            if (!req.body[data]) {
                res.status(400).send({ error: `${data} is required.` });

                return;
            }
        }

        const { token } = req.cookies;
        const { userIdx, name, email, id } = decodeToken(token);
        const { subject, content, idx } = req.body;
        const boardInfo = await boardView({ idx });

        if (!boardInfo || boardInfo && boardInfo.userIdx !== userIdx) {
            res.status(400).send({ error: 'Incorrect information.' });

            return;
        }

        await boardUpdate({
            subject,
            content,
            idx
        });

        const resetToken = signToken({ id, name, email, userIdx });

        res.cookie('token', resetToken, tokenOptions);
        res.json(true);
    }

    static async boardDelete(req, res) {
        const { token } = req.cookies;
        const { userIdx } = decodeToken(token);
        const { idx } = req.params;
        const boardInfo = await boardView({ idx });

        if (!boardInfo || boardInfo && boardInfo.userIdx !== userIdx) {
            res.status(400).send({ error: 'Incorrect information.' });

            return;
        }

        await boardDelete({ idx });

        res.json(true);
    }
}
