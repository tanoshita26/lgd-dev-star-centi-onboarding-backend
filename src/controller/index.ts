import express from 'express';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import DocxTemplate from 'docxtemplater';
// import ConvertAPI from 'convertapi';

// const convertapi = new ConvertAPI('secret_YcwGHS8NoWglAGJc');

export const submitForm = async (req: express.Request, res: express.Response) => {
  try {
    const templatePath = path.join(__dirname, '../templates/902.1e (Identification).docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new DocxTemplate(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' }
    });
    doc.render(req.body);
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw new Error('XML file not found');
    let xmlContent = xmlFile.asText();
    const rowRegex = /<w:tr[\s\S]*?<\/w:tr>/g;
    const rows = xmlContent.match(rowRegex) || [];
    const updatedRows = rows.map((row, index) => {
      const cellRegex = /<w:tc[\s\S]*?<\/w:tc>/g;
      const cells = row.match(cellRegex) || [];
      if (cells.length >= 2) {
        const label = cells[0]?.replace(/<[^>]+>/g, '').trim();
        if (label !== '') {
          const checkboxRegex = /(<w:checkBox[^>]*>[\s\S]*?<\/w:checkBox>)([\s\S]*?<w:t>(.*?)<\/w:t>)/g;
          let cellContent = cells[1], match;
          let count = 1;
          while ((match = checkboxRegex.exec(cellContent)) !== null) {
            const shouldBeChecked: boolean = req.body[`${index}:${count}`] === 'true' ? true : false;
            const newCheckboxTag = shouldBeChecked
              ? '<w:checkBox><w:checked/><w:default/><w:sizeAuto/></w:checkBox>'
              : '<w:checkBox><w:default/><w:sizeAuto/></w:checkBox>';
            cellContent = cellContent.replace(match[1], newCheckboxTag);
            count++;
          }
          if (cellContent !== cells[1]) {
            return row.replace(cells[1], cellContent);
          }
        }
        for (const key of Object.keys(req.body)) {
          if (index === Number(key)) {
            const updatedCell = cells[1].replace(/<w:t>.*?<\/w:t>/, `<w:t>${req.body[key]}</w:t>`);
            return row.replace(cells[1], updatedCell);
          }
        }
      }
      return row;
    });
    rows.forEach((row, index) => {
      xmlContent = xmlContent.replace(row, updatedRows[index]);
    });
    zip.file('word/document.xml', xmlContent);
    const updatedOutput = zip.generate({ type: 'nodebuffer' });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="filled.docx"',
    });
    return res.status(200).send(updatedOutput);
  } catch (error) {
    console.error('Error submitting form:', error);
    return res.status(500).json({ error: 'Failed to submit form' });
  }
}
