import db from '../config/db.js';

export const createCompany = async (req, res) => {
  const {
    code, name, address, email, phone, password,
    pf_code, esi_code, labour_license, domain_name,
    contact_person, website, super_admin_id, logo, createdAt, updatedAt // Use superAdminId (lowercase "d")
  } = req.body;

  try {
    console.log("Received Data:", req.body); // ✅ Log incoming request data

    const [result] = await db.query(
      `INSERT INTO companies 
      (code, name, address, email, phone, password, pf_code, esi_code, labour_license, domain_name, 
       contact_person,website, super_admin_id,  logo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, address, email, phone, password, pf_code, esi_code, labour_license, domain_name,
        contact_person, website, super_admin_id, logo] // Pass superAdminId here
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
    console.log("companies");
    const [companies] = await db.query('SELECT * FROM companies');
    console.log(companies);
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//gte company by id
export const getCompanyById = async (req, res) => {
  const { id } = req.params; // Get the company ID from the URL

  try {
    const [company] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);

    if (company.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.status(200).json(company[0]);
  } catch (err) {
    console.error("Error fetching company by ID:", err); // ✅ Log the error details
    res.status(500).json({ error: err.message });
  }
};

// Update a company by ID
export const updateCompany = async (req, res) => {
  const { id } = req.params; // Get the company ID from the URL
  const updatedData = req.body; // Get the updated data from the request body
  console.log("Updated Data:", updatedData); // ✅ Log the updated data
  console.log("dat from fromtend:", req.body); // ✅ Log the company ID
  // Check if updatedData is empty
  if (!Object.keys(updatedData).length) {
    return res.status(400).json({ error: 'No data provided for update' });
  }

  try {
    const [result] = await db.query('UPDATE companies SET ? WHERE id = ?', [updatedData, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const [updatedCompany] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
    res.status(200).json({ message: 'Company updated successfully', company: updatedCompany[0] });
  } catch (err) {
    console.error("Error updating company:", err); // ✅ Log the error details
    res.status(500).json({ error: err.message });
  }
};

// Delete a company by ID
export const deleteCompany = async (req, res) => {
  const { id } = req.params; // Get the company ID from the URL

  try {
    const [result] = await db.query('DELETE FROM companies WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error("Error deleting company:", err); // ✅ Log the error details
    res.status(500).json({ error: err.message });
  }
};