import express from 'express';
import multer from 'multer';
import { submitForm } from '../controller';
const router = express.Router();

const upload = multer();

router.post('/submit', upload.none(), submitForm);

export default router;
