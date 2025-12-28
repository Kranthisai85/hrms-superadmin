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
      COALESCE(${employeeAlias}.emp_code, ${companyAlias}.emp_code) as empCode,
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

// 3. Ensure module values are always numbers (not strings)
function ensureModuleValuesAreNumbers(company) {
  return {
    ...company,
    module_employee: Number(company.module_employee),
    module_attendance: Number(company.module_attendance),
    module_payroll: Number(company.module_payroll),
    module_reports: Number(company.module_reports),
  };
}

// 4. Validate and normalize module fields
function validateModuleFields(data) {
  const validModules = [
    "module_employee",
    "module_attendance",
    "module_payroll",
    "module_reports",
  ];

  validModules.forEach((module) => {
    if (data[module] !== undefined) {
      // Accept both "1"/"0" (strings) and 1/0 (numbers) and true/false (booleans)
      const value = String(data[module]).toLowerCase();
      if (!["0", "1", "true", "false"].includes(value)) {
        throw new Error(
          `Invalid value for ${module}: must be 0/1 or true/false, got "${data[module]}"`
        );
      }
      // Convert to number for consistency (0 or 1)
      data[module] = ["1", "true"].includes(value) ? 1 : 0;
    }
  });

  return data;
}

// 5. Format date to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
function formatDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

// 6. Default reasons that should be created for every new company
// These are 9 predefined reasons: 5 resignation reasons + 4 termination reasons
const DEFAULT_REASONS = [
  {
    name: "Better Opportunity",
    type: "resignation",
    status: "active",
  },
  {
    name: "Family Issues",
    type: "resignation",
    status: "active",
  },
  {
    name: "Health Issues",
    type: "resignation",
    status: "active",
  },
  {
    name: "Distance",
    type: "resignation",
    status: "active",
  },
  {
    name: "Personal Reason",
    type: "resignation",
    status: "active",
  },
  {
    name: "Misconduct",
    type: "termination",
    status: "active",
  },
  {
    name: "Poor Performance",
    type: "termination",
    status: "active",
  },
  {
    name: "Punctuality",
    type: "termination",
    status: "active",
  },
  {
    name: "Absconded",
    type: "termination",
    status: "active",
  },
];

// 7. Creates default reasons for a new company using raw SQL
async function createDefaultReasons(companyId) {
  try {
    console.log(`Creating default reasons for company ID: ${companyId}`);

    const currentTime = formatDate(new Date());

    // Prepare all reasons with companyId
    const reasonsToCreate = DEFAULT_REASONS.map((reason) => ({
      ...reason,
      company_id: companyId,
      created_at: currentTime,
      updated_at: currentTime,
    }));

    // Try different table name formats (snake_case is most common)
    // Try 'reasons' table first (with company_id, created_at, updated_at)
    try {
      // Build values placeholders for bulk insert
      const valuesPlaceholders = reasonsToCreate
        .map(() => "(?, ?, ?, ?, ?, ?)")
        .join(", ");

      const insertQuery = `
        INSERT INTO reasons (company_id, name, type, status, created_at, updated_at)
        VALUES ${valuesPlaceholders}
      `;

      // Flatten the values array for the query
      const values = reasonsToCreate.flatMap((reason) => [
        reason.company_id,
        reason.name,
        reason.type,
        reason.status,
        reason.created_at,
        reason.updated_at,
      ]);

      await db.query(insertQuery, values);
      console.log(
        `Successfully created ${reasonsToCreate.length} default reasons for company ${companyId}`
      );
      return true;
    } catch (firstErr) {
      // Try 'Reasons' table (with companyId, createdAt, updatedAt - camelCase)
      try {
        // Build values placeholders for bulk insert
        const valuesPlaceholders = reasonsToCreate
          .map(() => "(?, ?, ?, ?, ?, ?)")
          .join(", ");

        const insertQuery = `
          INSERT INTO Reasons (companyId, name, type, status, createdAt, updatedAt)
          VALUES ${valuesPlaceholders}
        `;

        // Flatten the values array for the query
        const values = reasonsToCreate.flatMap((reason) => [
          reason.company_id,
          reason.name,
          reason.type,
          reason.status,
          reason.created_at,
          reason.updated_at,
        ]);

        await db.query(insertQuery, values);
        console.log(
          `Successfully created ${reasonsToCreate.length} default reasons for company ${companyId}`
        );
        return true;
      } catch (secondErr) {
        // Table doesn't exist or different structure
        console.log(
          "Reasons table not found or different structure, skipping reasons creation"
        );
        console.log("Error details:", secondErr.message);
        return false;
      }
    }
  } catch (error) {
    console.error(
      `Error creating default reasons for company ${companyId}:`,
      error
    );
    // Don't throw - allow company creation to succeed even if reasons fail
    return false;
  }
}

// Unified function to handle both create and update company
const createOrUpdateCompany = async (req, res, next) => {
  const id = req.params?.id; // Will be undefined for create, defined for update
  const isUpdate = !!id;

  const {
    code, // Company code (for companies table)
    empCode, // Employee code (for employees table)
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
    pan_no,
    tan_no,
    company_type,
    sector,
    service_commences_on,
    // Module fields - defaults only apply for create
    module_employee,
    module_attendance,
    module_payroll,
    module_reports,
    // For user:
    last_name,
    date_of_birth,
    gender,
    blood_group,
  } = req.body;

  // Build data object - apply defaults for create mode
  const dataToProcess = isUpdate ? req.body : {
    code,
    empCode,
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
    logo,
    pan_no,
    tan_no,
    company_type,
    sector,
    service_commences_on,
    module_employee: module_employee !== undefined ? module_employee : 1,
    module_attendance: module_attendance !== undefined ? module_attendance : 0,
    module_payroll: module_payroll !== undefined ? module_payroll : 0,
    module_reports: module_reports !== undefined ? module_reports : 0,
    last_name,
    date_of_birth,
    gender,
    blood_group,
  };

  try {
    // 🔥 PREVENT CACHING - Ensure browser doesn't cache company data
    res.set({
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Validate and normalize module fields
    const moduleFieldsToValidate = {};
    if (dataToProcess.module_employee !== undefined) moduleFieldsToValidate.module_employee = dataToProcess.module_employee;
    if (dataToProcess.module_attendance !== undefined) moduleFieldsToValidate.module_attendance = dataToProcess.module_attendance;
    if (dataToProcess.module_payroll !== undefined) moduleFieldsToValidate.module_payroll = dataToProcess.module_payroll;
    if (dataToProcess.module_reports !== undefined) moduleFieldsToValidate.module_reports = dataToProcess.module_reports;

    const validatedData = validateModuleFields(moduleFieldsToValidate);
    // Merge validated module fields back
    Object.assign(dataToProcess, validatedData);

    // Convert month format (YYYY-MM) to full date (YYYY-MM-01) for service_commences_on
    if (dataToProcess.service_commences_on && dataToProcess.service_commences_on.match(/^\d{4}-\d{2}$/)) {
      dataToProcess.service_commences_on = dataToProcess.service_commences_on + "-01";
    }

    let companyId;
    let superAdminId;
    let employeeId = null;

    if (isUpdate) {
      // ========== UPDATE MODE ==========
      // Get existing company to find super admin ID
      const [existingCompany] = await db.query(
        "SELECT super_admin_id FROM companies WHERE id = ?",
        [id]
      );
      if (existingCompany.length === 0) {
        return res.status(404).json({ error: "Company not found" });
      }

      companyId = id;
      superAdminId = existingCompany[0].super_admin_id;

      // Separate fields for different tables
      const companyFields = [
        "code", "emp_code", "name", "address", "pf_code", "esi_code", "labour_license",
        "domain_name", "website", "logo", "pan_no", "tan_no", "company_type",
        "sector", "service_commences_on", "email", "phone", "contact_person",
        "password", "module_employee", "module_attendance", "module_payroll", "module_reports",
      ];
      const userFields = [
        "contact_person", "date_of_birth", "gender", "blood_group", "email", "phone", "password",
      ];
      const employeeFields = [
        "empCode",
      ];

      const companyData = {};
      const userData = {};
      const employeeData = {};

      // Filter fields for company table
      for (const key of companyFields) {
        // Map empCode from frontend to emp_code for database
        const sourceKey = key === "emp_code" ? "empCode" : key;
        if (dataToProcess[sourceKey] !== undefined) {
          if (key === "password") {
            // Only add password if it's NOT empty
            if (dataToProcess[sourceKey]) {
              companyData[key] = dataToProcess[sourceKey];
            }
          } else {
            companyData[key] = dataToProcess[sourceKey];
          }
        }
      }

      // Filter fields for user table
      for (const key of userFields) {
        if (dataToProcess[key] !== undefined) {
          if (key === "contact_person") {
            userData.name = dataToProcess[key];
          } else if (key === "password") {
            // Only update password if it's NOT empty
            if (dataToProcess[key]) {
              userData[key] = dataToProcess[key];
            }
          } else {
            userData[key] = dataToProcess[key];
          }
        }
      }

      // Filter fields for employee table
      for (const key of employeeFields) {
        if (dataToProcess[key] !== undefined) {
          if (key === "contact_person") {
            employeeData.first_name = dataToProcess[key];
          } else if (key === "empCode") {
            // Map empCode to emp_code in database
            // Only update if empCode is provided and not empty
            if (dataToProcess[key] && dataToProcess[key].trim() !== "") {
              employeeData.emp_code = dataToProcess[key].trim();
            }
          } else {
            employeeData[key] = dataToProcess[key];
          }
        }
      }

      // Update company table
      if (Object.keys(companyData).length > 0) {
        companyData.updated_at = new Date();
        const [result] = await db.query("UPDATE companies SET ? WHERE id = ?", [
          companyData,
          companyId,
        ]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Company not found" });
        }
      }

      // Update user table
      if (Object.keys(userData).length > 0 && superAdminId) {
        userData.updated_at = new Date();
        await db.query("UPDATE users SET ? WHERE id = ?", [userData, superAdminId]);
      }
      console.log("userData");
      console.log(userData);
      console.log("employeeData");
      console.log(employeeData);
      // Update employee table if it exists
      if (Object.keys(employeeData).length > 0 && superAdminId) {
        try {
          employeeData.updated_at = new Date();
          await db.query(
            "UPDATE employees SET ? WHERE user_id = ?",
            [employeeData, superAdminId]
          );
          console.log("Employee data updated successfully");
        } catch (employeeErr) {
          console.log(`Employees table not found, employee data not updated ${employeeErr.message}`);
        }
      }
    } else {
      // ========== CREATE MODE ==========
      // Validate required fields for create
      if (!password || (typeof password === "string" && password.trim() === "")) {
        return res.status(400).json({ error: "Password is required for creating a company" });
      }
      if (!code || (typeof code === "string" && code.trim() === "")) {
        return res.status(400).json({ error: "Company code is required for creating a company" });
      }
      if (!empCode || (typeof empCode === "string" && empCode.trim() === "")) {
        return res.status(400).json({ error: "Employee code is required for creating a company" });
      }

      // 1. Create the company
      const [companyResult] = await db.query(
        `INSERT INTO companies 
        (code, emp_code, name, address, pf_code, esi_code, labour_license, domain_name, 
         website, logo, pan_no, tan_no, company_type, sector, service_commences_on, 
         email, phone, contact_person, password,
         module_employee, module_attendance, module_payroll, module_reports, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          dataToProcess.code,
          dataToProcess.empCode,
          dataToProcess.name,
          dataToProcess.address,
          dataToProcess.pf_code,
          dataToProcess.esi_code,
          dataToProcess.labour_license,
          dataToProcess.domain_name,
          dataToProcess.website,
          dataToProcess.logo,
          dataToProcess.pan_no,
          dataToProcess.tan_no,
          dataToProcess.company_type,
          dataToProcess.sector,
          dataToProcess.service_commences_on,
          dataToProcess.email,
          dataToProcess.phone,
          dataToProcess.contact_person,
          dataToProcess.password,
          validatedData.module_employee,
          validatedData.module_attendance,
          validatedData.module_payroll,
          validatedData.module_reports,
        ]
      );

      companyId = companyResult.insertId;

      // 2. Create admin user
      const [userResult] = await db.query(
        `INSERT INTO users (name, last_name, email, password, role, phone, status, company_id, created_at, updated_at, date_of_birth, gender, blood_group)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)`,
        [
          dataToProcess.contact_person || dataToProcess.name,
          dataToProcess.last_name || "",
          dataToProcess.email,
          dataToProcess.password,
          "admin",
          dataToProcess.phone,
          "Active",
          companyId,
          dataToProcess.date_of_birth || null,
          dataToProcess.gender || null,
          dataToProcess.blood_group || null,
        ]
      );

      superAdminId = userResult.insertId;

      // 3. Try to create employee record if employees table exists
      try {
        const [employeeResult] = await db.query(
          `INSERT INTO employees (
            user_id, emp_code, created_at, updated_at
          ) VALUES (?, ?, NOW(), NOW())`,
          [
            superAdminId,
            (dataToProcess.empCode && dataToProcess.empCode.trim() !== "") 
              ? dataToProcess.empCode.trim() 
              : dataToProcess.code.trim(), // Use empCode, fallback to code for backwards compatibility
          ]
        );
        employeeId = employeeResult.insertId;
        const insertedEmpCode = (dataToProcess.empCode && dataToProcess.empCode.trim() !== "") 
          ? dataToProcess.empCode.trim() 
          : dataToProcess.code.trim();
        console.log("Employee record created successfully with emp_code:", insertedEmpCode);
      } catch (employeeErr) {
        console.log("Employees table not found, skipping employee creation:", employeeErr.message);
      }

      // 4. Update the company with the super_admin_id
      await db.query("UPDATE companies SET super_admin_id = ? WHERE id = ?", [
        superAdminId,
        companyId,
      ]);

      // 5. Create default reasons (only for new companies)
      try {
        await createDefaultReasons(companyId);
        console.log(`Default reasons created for company: ${dataToProcess.name} (ID: ${companyId})`);
      } catch (reasonError) {
        console.error("Error creating default reasons:", reasonError);
        // Don't fail company creation if reasons creation fails
      }
    }

    // ========== FETCH AND RETURN DATA ==========
    // Try to fetch with employee data first, fall back to users only
    try {
      const [companyResult] = await db.query(
        `
        ${getCompanySelectQueryWithEmployee("c", "u", "e")}
        FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        WHERE c.id = ?
        `,
        [companyId]
      );

      if (companyResult.length === 0) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Format service_commences_on
      const companyData = { ...companyResult[0] };
      if (companyData.service_commences_on) {
        const date = new Date(companyData.service_commences_on);
        companyData.service_commences_on =
          date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      }

      // Clear cache for updates
      if (isUpdate) {
        const cacheKey = `companies:${companyId}`;
        try {
          if (typeof global.cacheService !== "undefined" && global.cacheService?.del) {
            global.cacheService.del(cacheKey);
            console.log("🔄 Cache cleared for key:", cacheKey);
          }
        } catch (cacheErr) {
          console.log("ℹ️ Error clearing cache:", cacheErr.message);
        }
      }

      const responseData = ensureModuleValuesAreNumbers(companyData);

      if (isUpdate) {
        res.status(200).json({
          message: "Company updated successfully",
          company: responseData,
        });
      } else {
        res.status(201).json({
          message: employeeId
            ? "Company, created successfully"
            : "Company created successfully",
          company: responseData,
          user_id: superAdminId,
          employee_id: employeeId,
        });
      }
    } catch (fetchErr) {
      // Fall back to users table only
      console.log(`Employees table not found, using users table only ${fetchErr.message}`);
      const [companyResult] = await db.query(
        `
        ${getCompanySelectQueryWithoutEmployee("c", "u")}
        FROM companies c
        LEFT JOIN users u ON c.super_admin_id = u.id
        WHERE c.id = ?
        `,
        [companyId]
      );

      if (companyResult.length === 0) {
        return res.status(404).json({ error: "Company not found" });
      }

      const companyData = { ...companyResult[0] };
      if (companyData.service_commences_on) {
        const date = new Date(companyData.service_commences_on);
        companyData.service_commences_on =
          date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
      }

      const responseData = ensureModuleValuesAreNumbers(companyData);

      if (isUpdate) {
        res.status(200).json({
          message: "Company updated successfully",
          company: responseData,
        });
      } else {
        res.status(201).json({
          message: "Company and admin user created successfully",
          company: responseData,
          user_id: superAdminId,
        });
      }
    }
  } catch (err) {
    // Check if this is a validation error for module fields
    if (err.message && err.message.includes("Invalid value for")) {
      console.error("Module validation error:", err.message);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    console.error(`Error ${isUpdate ? "updating" : "creating"} company:`, err);
    next(err);
  }
};

// Export as separate functions for route compatibility
export const createCompany = async (req, res, next) => {
  // Remove id from params if somehow present
  delete req.params.id;
  return createOrUpdateCompany(req, res, next);
};

export const updateCompany = async (req, res, next) => {
  // Ensure id is in params
  return createOrUpdateCompany(req, res, next);
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
        return ensureModuleValuesAreNumbers(company);
      });

      // 🔥 PREVENT CACHING - Company data changes frequently (module updates)
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
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
        return ensureModuleValuesAreNumbers(company);
      });

      // 🔥 PREVENT CACHING - Company data changes frequently (module updates)
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
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
    // 🆕 Set cache-busting headers and check for skip cache flag
    res.set({
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Check if we should skip cache (for fresh updates after modifications)
    const skipCache =
      req.query.skipCache === "true" || req.headers["x-skip-cache"];
    const cacheKey = `companies:${id}`;

    // 🆕 Check cache if available and not skipping
    if (
      !skipCache &&
      typeof global.cacheService !== "undefined" &&
      global.cacheService?.get
    ) {
      try {
        const cachedData = global.cacheService.get(cacheKey);
        if (cachedData) {
          console.log("📦 Returning cached data for company:", id);
          return res.json(cachedData);
        }
      } catch (cacheErr) {
        console.log("ℹ️ Error retrieving from cache:", cacheErr.message);
      }
    }

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

      // 🔥 PREVENT CACHING - Company data changes frequently (module updates)
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      });

      const responseData = ensureModuleValuesAreNumbers(companyData);

      // 🆕 Set cache with TTL (30 minutes) if cacheService available
      try {
        if (
          typeof global.cacheService !== "undefined" &&
          global.cacheService?.set
        ) {
          global.cacheService.set(cacheKey, responseData, 1800); // 30 minutes TTL
          console.log("💾 Cached company data for key:", cacheKey);
        }
      } catch (cacheErr) {
        console.log("ℹ️ Error setting cache:", cacheErr.message);
      }

      console.log("✅ Returning fresh company data:", companyData);
      res.status(200).json(responseData);
    } catch (employeeErr) {
      // If employees table doesn't exist, fall back to users table only
      console.log("Employees table not found, using users table only");
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

      // 🔥 PREVENT CACHING - Company data changes frequently (module updates)
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      });

      const responseData = ensureModuleValuesAreNumbers(companyData);

      // 🆕 Set cache with TTL (30 minutes) if cacheService available
      try {
        if (
          typeof global.cacheService !== "undefined" &&
          global.cacheService?.set
        ) {
          global.cacheService.set(cacheKey, responseData, 1800); // 30 minutes TTL
          console.log("💾 Cached company data for key:", cacheKey);
        }
      } catch (cacheErr) {
        console.log("ℹ️ Error setting cache:", cacheErr.message);
      }

      console.log("✅ Returning fresh company data:", companyData);
      res.status(200).json(responseData);
    }
  } catch (err) {
    console.error("Error fetching company by ID:", err);
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
        // Cascade delete: 
        // 1. First, set super_admin_id to NULL to break the foreign key constraint
        // 2. Then delete users
        // 3. Finally delete the company
        await db.query("UPDATE companies SET super_admin_id = NULL WHERE id = ?", [id]);
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
      // No users associated, but still need to handle super_admin_id constraint
      // Set super_admin_id to NULL first to break the foreign key constraint
      await db.query("UPDATE companies SET super_admin_id = NULL WHERE id = ?", [id]);
      
      // Now delete the company
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
