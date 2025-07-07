
export const uploadLogo = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // https://pacehrm.com/uploads/logos/<filename>
        // Works in dev too (e.g. http://localhost:3000/uploads/…)
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            fileUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};