import db from '../config/db.js';

export const createCompany = async (req, res) => {
  const {
    code, name, address, email, phone, password,
    pfCode, esiCode, labourLicense, domainName,
    contactPerson, website, superAdminID, logo, createdAt, updatedAt
  } = req.body;

  try {
    console.log("Received Data:", req.body); // ✅ Log incoming request data

    const [result] = await db.query(
      `INSERT INTO companies 
      (code, name, address, email, phone, password, pfCode, esiCode, labourLicense, domainName, 
       contactPerson, website, superAdminID, logo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, address, email, phone, password, pfCode, esiCode, labourLicense, domainName,
       contactPerson, website, superAdminID, logo]
    );

    const companyId = result.insertId;
    const [company] = await db.query('SELECT * FROM companies WHERE id = ?', [companyId]);

    res.status(201).json({ message: 'Company created successfully', company: company[0] });
  } catch (err) {
    console.error("Error creating company:", err); // ✅ Log the error details
    res.status(500).json({ error: err.message });
  }
};


export const getCompanies = async (req, res) => {
  try {
    const [companies] = await db.query('SELECT * FROM companies');
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};