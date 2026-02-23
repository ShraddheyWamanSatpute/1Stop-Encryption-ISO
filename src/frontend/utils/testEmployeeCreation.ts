/**
 * Test utility to create sample employees for testing the HR system
 */

export interface TestEmployee {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  status: string;
  hireDate: number;
  employmentType?: string;
  salary?: number;
  hourlyRate?: number;
  payType?: string;
}

/**
 * Sample employee data for testing
 */
export const SAMPLE_EMPLOYEES: TestEmployee[] = [
  {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@company.com",
    phone: "+44 7700 900123",
    position: "Manager",
    department: "Management",
    status: "active",
    hireDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
    employmentType: "full-time",
    salary: 45000,
    payType: "salary"
  },
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@company.com",
    phone: "+44 7700 900124",
    position: "Chef",
    department: "Kitchen",
    status: "active",
    hireDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
    employmentType: "full-time",
    hourlyRate: 18.50,
    payType: "hourly"
  },
  {
    firstName: "Mike",
    lastName: "Wilson",
    email: "mike.wilson@company.com",
    phone: "+44 7700 900125",
    position: "Waiter",
    department: "Front of House",
    status: "active",
    hireDate: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
    employmentType: "part-time",
    hourlyRate: 12.50,
    payType: "hourly"
  },
  {
    firstName: "Emma",
    lastName: "Davis",
    email: "emma.davis@company.com",
    phone: "+44 7700 900126",
    position: "Bartender",
    department: "Bar",
    status: "active",
    hireDate: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
    employmentType: "full-time",
    hourlyRate: 15.00,
    payType: "hourly"
  },
  {
    firstName: "Tom",
    lastName: "Brown",
    email: "tom.brown@company.com",
    phone: "+44 7700 900127",
    position: "Cleaner",
    department: "Maintenance",
    status: "active",
    hireDate: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
    employmentType: "part-time",
    hourlyRate: 11.00,
    payType: "hourly"
  }
];

/**
 * Create sample employees using the HR context
 * This function should be called from a component that has access to HRContext
 */
export async function createSampleEmployees(addEmployeeFunction: (employee: any) => Promise<any>): Promise<{
  success: boolean;
  created: number;
  errors: string[];
}> {
  const results = {
    success: true,
    created: 0,
    errors: [] as string[]
  };

  console.log("🧪 Creating sample employees...");

  for (const employeeData of SAMPLE_EMPLOYEES) {
    try {
      console.log(`Creating employee: ${employeeData.firstName} ${employeeData.lastName}`);
      
      const result = await addEmployeeFunction(employeeData);
      
      if (result) {
        results.created++;
        console.log(`✅ Created: ${employeeData.firstName} ${employeeData.lastName}`);
      } else {
        results.errors.push(`Failed to create ${employeeData.firstName} ${employeeData.lastName}`);
        console.error(`❌ Failed to create: ${employeeData.firstName} ${employeeData.lastName}`);
      }
    } catch (error) {
      const errorMessage = `Error creating ${employeeData.firstName} ${employeeData.lastName}: ${error}`;
      results.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  if (results.errors.length > 0) {
    results.success = false;
  }

  console.log(`🎯 Sample employee creation complete:`, {
    created: results.created,
    errors: results.errors.length,
    success: results.success
  });

  return results;
}

/**
 * Quick test function to run in browser console
 * This requires the HRContext to be available globally
 */
export function quickCreateSampleEmployees(): void {
  console.log("🧪 Quick sample employee creation");
  console.log("This function requires HRContext to be available.");
  console.log("Please use createSampleEmployees() from a component with HRContext access.");
  console.log("Sample employees available:", SAMPLE_EMPLOYEES.length);
  console.log("Sample employee preview:", SAMPLE_EMPLOYEES.map(emp => `${emp.firstName} ${emp.lastName} (${emp.position})`));
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).quickCreateSampleEmployees = quickCreateSampleEmployees;
  (window as any).SAMPLE_EMPLOYEES = SAMPLE_EMPLOYEES;
  console.log("💡 Run 'quickCreateSampleEmployees()' in console to see sample employee info");
}
