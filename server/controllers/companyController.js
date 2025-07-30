import db from '../config/db.js';

export const createCompany = async (req, res, next) => {
  const {
    code, name, address, email, phone, password,
    pf_code, esi_code, labour_license, domain_name,
    contact_person, website, super_admin_id, logo, createdAt, updatedAt,
    pan_no, tan_no, company_type, sector, // new fields
    // For user:
    last_name, date_of_birth, gender, blood_group
  } = req.body;

  try {
    // 1. First, create the company
    const [companyResult] = await db.query(
      `INSERT INTO companies 
      (code, name, address, email, phone, password, pf_code, esi_code, labour_license, domain_name, 
       contact_person, website, logo, pan_no, tan_no, company_type, sector, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        code, name, address, email, phone, password, pf_code, esi_code, labour_license, domain_name,
        contact_person, website, logo, pan_no, tan_no, company_type, sector
      ]
    );

    const companyId = companyResult.insertId;

    // 2. Then, create the user with company_id
    const [userResult] = await db.query(
      `INSERT INTO users (name, last_name, email, password, role, phone, status, company_id, created_at, updated_at, date_of_birth, gender, blood_group)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)`,
      [
        contact_person || name,
        last_name || '',
        email,
        password,
        'super_admin',
        phone,
        'Active',
        companyId, // Add company_id to user
        date_of_birth || null,
        gender || null,
        blood_group || null
      ]
    );

    const superAdminId = userResult.insertId;

    // 3. Update the company with the super_admin_id
    await db.query(
      'UPDATE companies SET super_admin_id = ? WHERE id = ?',
      [superAdminId, companyId]
    );

    // 4. Fetch the complete company data
    const [company] = await db.query('SELECT * FROM companies WHERE id = ?', [companyId]);

    res.status(201).json({ message: 'Company and super admin created successfully', company: company[0] });
  } catch (err) {
    console.error("Error creating company:", err);
    next(err);
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    console.log("companies");
    const [companies] = await db.query('SELECT * FROM companies');
    console.log(companies);
    res.status(200).json(companies);
  } catch (err) {
    next(err);
  }
};
//gte company by id
export const getCompanyById = async (req, res, next) => {
  const { id } = req.params; // Get the company ID from the URL

  try {
    const [company] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);

    if (company.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.status(200).json(company[0]);
  } catch (err) {
    console.error("Error fetching company by ID:", err);
    next(err);
  }
};

// Update a company by ID
export const updateCompany = async (req, res, next) => {
  const { id } = req.params; // Get the company ID from the URL
  const updatedData = req.body; // Get the updated data from the request body
  // Only allow updating the fields that exist in the DB
  const allowedFields = [
    'code', 'name', 'address', 'email', 'phone', 'password',
    'pf_code', 'esi_code', 'labour_license', 'domain_name',
    'contact_person', 'website', 'super_admin_id', 'logo',
    'pan_no', 'tan_no', 'company_type', 'sector',
    'created_at', 'updated_at'
  ];
  const filteredData = {};
  for (const key of allowedFields) {
    if (updatedData[key] !== undefined) filteredData[key] = updatedData[key];
  }
  if (!Object.keys(filteredData).length) {
    return res.status(400).json({ error: 'No valid data provided for update' });
  }
  try {
    const [result] = await db.query('UPDATE companies SET ? WHERE id = ?', [filteredData, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const [updatedCompany] = await db.query('SELECT * FROM companies WHERE id = ?', [id]);
    res.status(200).json({ message: 'Company updated successfully', company: updatedCompany[0] });
  } catch (err) {
    console.error("Error updating company:", err);
    next(err);
  }
};

// Delete a company by ID
export const deleteCompany = async (req, res, next) => {
  const { id } = req.params; // Get the company ID from the URL
  const { cascade } = req.query; // Check if cascade delete is requested

  try {
    // First, check if there are any users associated with this company
    const [users] = await db.query('SELECT COUNT(*) as userCount FROM users WHERE company_id = ?', [id]);
    
    if (users[0].userCount > 0) {
      if (cascade === 'true') {
        // Cascade delete: Delete users first, then company
        await db.query('DELETE FROM users WHERE company_id = ?', [id]);
        const [result] = await db.query('DELETE FROM companies WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        res.status(200).json({ 
          message: `Company and ${users[0].userCount} associated users deleted successfully` 
        });
      } else {
        // Return error with user count
        return res.status(400).json({ 
          error: `Cannot delete company. There are ${users[0].userCount} users associated with this company.`,
          userCount: users[0].userCount,
          hasUsers: true
        });
      }
    } else {
      // No users associated, proceed with deletion
      const [result] = await db.query('DELETE FROM companies WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.status(200).json({ message: 'Company deleted successfully' });
    }
  } catch (err) {
    console.error("Error deleting company:", err);
    next(err);
  }
};