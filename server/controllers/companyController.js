import db from "../config/db.js";
// --- ADD THIS FUNCTION ---
// 1. For the 'try' blocks (includes 'e.id')
function getCompanySelectQueryWithEmployee(
  companyAlias = "c",
  userAlias = "u",
  employeeAlias = "e"
) {
  return `
    SELECT 
      ${companyAlias}.*,
      COALESCE(${companyAlias}.password, ${userAlias}.password) as password, 
      ${companyAlias}.email as email,
      ${companyAlias}.phone as phone,
      ${companyAlias}.contact_person as contact_person,
      ${employeeAlias}.id as employee_id,
      ${companyAlias}.module_employee,
      ${companyAlias}.module_attendance,
      ${companyAlias}.module_payroll,
      ${companyAlias}.module_reports
  `;
}

// 2. For the 'catch' blocks (DOES NOT include 'e.id')
function getCompanySelectQueryWithoutEmployee(
  companyAlias = "c",
  userAlias = "u"
) {
  return `
    SELECT 
      ${companyAlias}.*,
      ${companyAlias}.password,
      ${companyAlias}.email as email,
      ${companyAlias}.phone as phone,
      ${companyAlias}.contact_person as contact_person,
      ${companyAlias}.module_employee,
      ${companyAlias}.module_attendance,
      ${companyAlias}.module_payroll,
      ${companyAlias}.module_reports
  `;
}
export const createCompany = async (req, res, next) => {
  const {
    code,
    name,
    address,
    email,
    phone,
    password,
    pf_code,
    esi_code,
    labour_license,
    domain_name,
    contact_person,
    website,
    super_admin_id,
    logo,
    createdAt,
    updatedAt,
    pan_no,
    tan_no,
    company_type,
    sector,
    service_commences_on, // new fields
    // For user:
    last_name,
    date_of_birth,
    gender,
    blood_group,
  } = req.body;

  // Convert month format (YYYY-MM) to full date (YYYY-MM-01) for service_commences_on
  let formattedServiceCommencesOn = service_commences_on;
  if (service_commences_on && service_commences_on.match(/^\d{4}-\d{2}$/)) {
    formattedServiceCommencesOn = service_commences_on + "-01";
  }

  try {
    // 1. First, create the company
    const [companyResult] = await db.query(
      `INSERT INTO companies 
      (code, name, address, pf_code, esi_code, labour_license, domain_name, 
       website, logo, pan_no, tan_no, company_type, sector, service_commences_on, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        code,
        name,
        address,
        pf_code,
        esi_code,
        labour_license,
        domain_name,
        website,
        logo,
        pan_no,
        tan_no,
        company_type,
        sector,
        formattedServiceCommencesOn,
      ]
    );

    const companyId = companyResult.insertId;

    // 2. Create admin user (password and auth info)
    const [userResult] = await db.query(
      `INSERT INTO users (name, last_name, email, password, role, phone, status, company_id, created_at, updated_at, date_of_birth, gender, blood_group)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)`,
      [
        contact_person || name,
        last_name || "",
        email, // Email in users table as fallback
        password,
        "admin",
        phone,
        "Active",
        companyId,
        date_of_birth || null,
        gender || null,
        blood_group || null,
      ]
    );

    const superAdminId = userResult.insertId;
    let employeeId = null;

    // 3. Try to create employee record if employees table exists
    try {
      const [employeeResult] = await db.query(
        `INSERT INTO employees (
          company_id, user_id, employee_code, first_name, last_name, email, phone, 
          date_of_birth, gender, blood_group, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          companyId,
          superAdminId,
          code, // Using company code as employee code for admin
          contact_person || name,
          last_name || "",
          email, // Email goes to employee table
          phone,
          date_of_birth || null,
          gender || null,
          blood_group || null,
          "Active",
        ]
      );
      employeeId = employeeResult.insertId;
      console.log("Employee record created successfully");
    } catch (employeeErr) {
      console.log("Employees table not found, skipping employee creation");
    }

    // 4. Update the company with the super_admin_id
    await db.query("UPDATE companies SET super_admin_id = ? WHERE id = ?", [
      superAdminId,
      companyId,
    ]);

    // 5. Fetch the complete data for API response (try with employee data first)
    const [company] = await db.query("SELECT * FROM companies WHERE id = ?", [
      companyId,
    ]);
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [
      superAdminId,
    ]);

    let responseCompany;

    if (employeeId) {
      // If employee was created, get data from employee table
      const [employee] = await db.query(
        "SELECT * FROM employees WHERE id = ?",
        [employeeId]
      );
      responseCompany = {
        ...company[0],
        email: employee[0].email, // From employee table
        phone: employee[0].phone, // From employee table
        password: user[0].password, // From user table
        contact_person: employee[0].first_name, // From employee table
        super_admin_id: superAdminId, // Set the super admin ID
        employee_id: employeeId, // Include employee ID
      };
    } else {
      // Fall back to user data
      responseCompany = {
        ...company[0],
        email: user[0].email, // From user table
        phone: user[0].phone, // From user table
        password: user[0].password, // From user table
        contact_person: user[0].name, // From user table
        super_admin_id: superAdminId, // Set the super admin ID
      };
    }

    res.status(201).json({
      message: employeeId
        ? "Company, admin user, and employee created successfully"
        : "Company and admin user created successfully",
      company: responseCompany,
      user_id: superAdminId,
      employee_id: employeeId,
    });
  } catch (err) {
    console.error("Error creating company:", err);
    next(err);
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    console.log("companies");
    // Try to join with employees table, fall back to users if it doesn't exist
    try {
      const [companies] = await db.query(`
        ${getCompanySelectQueryWithEmployee("c", "u", "e")}
      FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id AND u.company_id = c.id
      `);

      // Format service_commences_on to avoid timezone issues
      const formattedCompanies = companies.map((company) => {
        if (company.service_commences_on) {
          const date = new Date(company.service_commences_on);
          company.service_commences_on =
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0");
        }
        return company;
      });

      res.status(200).json(formattedCompanies);
    } catch (employeeErr) {
      console.log(employeeErr);
      // If employees table doesn't exist, fall back to users table only
      console.log("Employees table not found, using users table");
      const [companies] = await db.query(`
      ${getCompanySelectQueryWithEmployee("c", "u")}
      FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
      `);

      // Format service_commences_on to avoid timezone issues
      const formattedCompanies = companies.map((company) => {
        if (company.service_commences_on) {
          const date = new Date(company.service_commences_on);
          company.service_commences_on =
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0");
        }
        return company;
      });

      res.status(200).json(formattedCompanies);
    }
  } catch (err) {
    next(err);
  }
};
//gte company by id
export const getCompanyById = async (req, res, next) => {
  const { id } = req.params; // Get the company ID from the URL

  try {
    // Try to join with employees table, fall back to users if it doesn't exist
    try {
      const [company] = await db.query(
        `
        ${getCompanySelectQueryWithEmployee("c", "u", "e")}
      FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id AND e.company_id = c.id
        WHERE c.id = ?
      `,
        [id]
      );

      if (company.length === 0) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Format service_commences_on to avoid timezone issues
      const companyData = { ...company[0] };
      if (companyData.service_commences_on) {
        // Convert to YYYY-MM format for month input compatibility
        const date = new Date(companyData.service_commences_on);
        companyData.service_commences_on =
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0");
      }

      res.status(200).json(companyData);
    } catch (employeeErr) {
      // If employees table doesn't exist, fall back to users table only
      console.log("Employees table not found, using users tablessss");
      const [company] = await db.query(
        `
        ${getCompanySelectQueryWithEmployee("c", "u")}
      FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        WHERE c.id = ?
      `,
        [id]
      );

      if (company.length === 0) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Format service_commences_on to avoid timezone issues
      const companyData = { ...company[0] };
      if (companyData.service_commences_on) {
        // Convert to YYYY-MM format for month input compatibility
        const date = new Date(companyData.service_commences_on);
        companyData.service_commences_on =
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0");
      }

      res.status(200).json(companyData);
    }
  } catch (err) {
    console.error("Error fetching company by ID:", err);
    next(err);
  }
};

// Update a company by ID
export const updateCompany = async (req, res, next) => {
  const { id } = req.params; // Get the company ID from the URL
  const updatedData = req.body; // Get the updated data from the request body

  // Convert month format (YYYY-MM) to full date (YYYY-MM-01) for service_commences_on
  if (
    updatedData.service_commences_on &&
    updatedData.service_commences_on.match(/^\d{4}-\d{2}$/)
  ) {
    updatedData.service_commences_on = updatedData.service_commences_on + "-01";
  }

  try {
    // First, get the company to find the super admin ID
    const [company] = await db.query(
      "SELECT super_admin_id FROM companies WHERE id = ?",
      [id]
    );
    if (company.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const superAdminId = company[0].super_admin_id;

    // Separate fields for different tables (using current structure)
    const companyFields = [
      "code",
      "name",
      "address",
      "pf_code",
      "esi_code",
      "labour_license",
      "domain_name",
      "website",
      "logo",
      "pan_no",
      "tan_no",
      "company_type",
      "sector",
      "service_commences_on",
      "email",
      "phone",
      "contact_person",
      "password",
      "module_employee",
      "module_attendance",
      "module_payroll",
      "module_reports",
    ];
    const userFields = [
      "contact_person",
      "date_of_birth",
      "gender",
      "blood_group",
    ];

    const companyData = {};
    const userData = {};

    // Filter fields for company table
    // Filter fields for company table
    for (const key of companyFields) {
      if (updatedData[key] !== undefined) {
        // Check for the password field
        if (key === "password") {
          // Only add password to the save list if it's NOT empty
          if (updatedData[key]) {
            companyData[key] = updatedData[key];
          }
        } else {
          // This 'else' block runs for 'name', 'email', 'phone', etc.
          // This line adds them to the data that will be saved:
          companyData[key] = updatedData[key];
        }
      }
    }

    // Filter fields for user table (map contact_person to name)
    for (const key of userFields) {
      if (updatedData[key] !== undefined) {
        if (key === "contact_person") {
          userData.name = updatedData[key];
        } else {
          userData[key] = updatedData[key];
        }
      }
    }

    // Update company table if there are company fields to update
    if (Object.keys(companyData).length > 0) {
      companyData.updated_at = new Date();
      const [result] = await db.query("UPDATE companies SET ? WHERE id = ?", [
        companyData,
        id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Company not found" });
      }
    }

    // Update user table if there are user fields to update
    if (Object.keys(userData).length > 0 && superAdminId) {
      userData.updated_at = new Date();
      await db.query("UPDATE users SET ? WHERE id = ?", [
        userData,
        superAdminId,
      ]);
    }

    // Try to update employee table if it exists and there are employee-specific fields
    const employeeFields = [
      "email",
      "phone",
      "contact_person",
      "date_of_birth",
      "gender",
      "blood_group",
    ];
    const employeeData = {};

    for (const key of employeeFields) {
      if (updatedData[key] !== undefined) {
        if (key === "contact_person") {
          employeeData.first_name = updatedData[key];
        } else {
          employeeData[key] = updatedData[key];
        }
      }
    }

    if (Object.keys(employeeData).length > 0 && superAdminId) {
      try {
        employeeData.updated_at = new Date();
        await db.query(
          "UPDATE employees SET ? WHERE user_id = ? AND company_id = ?",
          [employeeData, superAdminId, id]
        );
        console.log("Employee data updated successfully");
      } catch (employeeErr) {
        console.log("Employees table not found, employee data not updated");
      }
    }

    // Fetch updated company data (try with employee data first)
    try {
      const [updatedCompany] = await db.query(
        `
       ${getCompanySelectQueryWithEmployee("c", "u", "e")}
      FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id AND e.company_id = c.id
        WHERE c.id = ?
      `,
        [id]
      );

      // Format service_commences_on to avoid timezone issues
      const companyData = { ...updatedCompany[0] };
      if (companyData.service_commences_on) {
        const date = new Date(companyData.service_commences_on);
        companyData.service_commences_on =
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0");
      }

      res.status(200).json({
        message: "Company updated successfully",
        company: companyData,
      });
    } catch (employeeErr) {
      // Fall back to users table only
      console.log("Employees table not found, using users table for response");
      const [updatedCompany] = await db.query(
        `
       ${getCompanySelectQueryWithoutEmployee("c", "u")}
        FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        WHERE c.id = ?
      `,
        [id]
      );

      // Format service_commences_on to avoid timezone issues
      const companyData = { ...updatedCompany[0] };
      if (companyData.service_commences_on) {
        const date = new Date(companyData.service_commences_on);
        companyData.service_commences_on =
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0");
      }

      res.status(200).json({
        message: "Company updated successfully",
        company: companyData,
      });
    }
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
    const [users] = await db.query(
      "SELECT COUNT(*) as userCount FROM users WHERE company_id = ?",
      [id]
    );

    if (users[0].userCount > 0) {
      if (cascade === "true") {
        // Cascade delete: Delete users first, then company
        await db.query("DELETE FROM users WHERE company_id = ?", [id]);
        const [result] = await db.query("DELETE FROM companies WHERE id = ?", [
          id,
        ]);

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Company not found" });
        }

        res.status(200).json({
          message: `Company and ${users[0].userCount} associated users deleted successfully`,
        });
      } else {
        // Return error with user count
        return res.status(400).json({
          error: `Cannot delete company. There are ${users[0].userCount} users associated with this company.`,
          userCount: users[0].userCount,
          hasUsers: true,
        });
      }
    } else {
      // No users associated, proceed with deletion
      const [result] = await db.query("DELETE FROM companies WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.status(200).json({ message: "Company deleted successfully" });
    }
  } catch (err) {
    console.error("Error deleting company:", err);
    next(err);
  }
};
