export const departmentTypes = {
    academic: {
        name: "Academic Departments",
        departments: {
            "Provost and Vice-President, Academic": {
                "Faculty of Human and Health Sciences": {
                    "Department of Psychology": ["Psychology"],
                    "School of Education": ["Education"],
                    "School of Health Sciences": ["Health Sciences"],
                    "School of Nursing": ["Nursing"],
                    "School of Social Work": ["Social Work"]
                },
                "Faculty of Indigenous Studies, Social Sciences and Humanities": {
                    "Department of Anthropology": ["Anthropology"],
                    "Department of English": ["English"],
                    "Department of First Nations Studies": ["First Nations Studies"],
                    "Department of History": ["History"],
                    "Department of Global and International Studies": ["International Studies"],
                    "Department of Political Science": ["Political Science"],
                    "Women's and Gender Studies": ["Women's Studies"],
                    "Northern Studies": ["Northern Studies"],
                    "Interdisciplinary Studies": ["Interdisciplinary Studies"]
                },
                "Division of Medical Sciences": {
                    "UBC Northern Medical Program (NMP)": ["NMP"],
                    "UBC Master of Physical Therapy - North": ["Physical Therapy"],
                    "UBC Master of Occupational Therapy (MOT) - Northern and Rural Cohort": ["Occupational Therapy"],
                    "UBC Postgraduate Medical Education - Residency Training": ["Medical Education"]
                },
                "Faculty of Science and Engineering": {
                    "Chemistry and Biochemistry": ["Chemistry"],
                    "Computer Science": ["Computer Science"],
                    "Integrated Science": ["Integrated Science"],
                    "Mathematics and Statistics": ["Mathematics"],
                    "Physics": ["Physics"],
                    "School of Engineering": ["Engineering"]
                },
                "Faculty of Environment": {
                    "Department of Geography, Earth and Environmental Sciences": {
                        "Environmental Science": ["Environmental Science"],
                        "Geography": ["Geography"]
                    },
                    "Department of Ecosystem Science and Management": {
                        "Biology": ["Biology"],
                        "Conservation Science and Practice": ["Conservation Science"],
                        "Forest Ecology and Management": ["Forestry"],
                        "Outdoor Recreation and Tourism Management": ["Outdoor Recreation"],
                        "Wildlife and Fisheries": ["Wildlife and Fisheries"]
                    },
                    "School of Planning and Sustainability": {
                        "Environmental and Sustainability Studies": ["Sustainability"],
                        "Planning": ["Planning"]
                    }
                },
                "Faculty of Business and Economics": {
                    "School of Business": ["Business"],
                    "Economics": ["Economics"]
                },
                // Student service departments, in the order of unbc.ca/about-unbc/student-service-departments.
                // That page nests a few units a level deeper (Counselling Centre and Health Services under
                // the Health and Wellness Centre, Co-operative Education under the Student Career Centre);
                // the hierarchy stops at four levels, so they sit beside their parent unit instead.
                "Centre for Teaching, Learning and Technology": ["CTLT"],
                "Chemstores": ["Chemstores"],
                "Geoffrey R. Weller Library": {
                    "Northern BC Archives & Special Collections": ["Archives"]
                },
                "Office of Student Recruitment": ["Recruitment"],
                "Northern Analytical Laboratory Services": ["NALS"],
                "Office of the Registrar": ["Registrar"],
                "Office of Graduate Programs": ["Graduate Programs"],
                "Student Success": {
                    "Academic Advising": ["Advising"],
                    "Academic Success Centre": ["Success Centre"],
                    "Access Resource Centre": ["Accessibility"],
                    "Financial Aid": ["Awards"],
                    "First Nations Centre": ["FNC"],
                    "Health and Wellness Centre": ["Wellness"],
                    "Counselling Centre": ["Counselling"],
                    "Health Services": ["Health Services"],
                    "Housing and Residence Life": ["Housing"],
                    "International Exchanges and Student Programs": ["International"],
                    "Student Career Centre": ["Careers"],
                    "Co-operative Education": ["Co-op"]
                }
            }
        }
    },
    administrative: {
        name: "Administrative Departments",
        departments: {
            "President": {
                "Athletics": ["Athletics"],
                "Office of Indigenous Initiatives": ["Indigenous Initiatives"]
            },
            "Vice-President, Finance and Administration": {
                "Facilities": ["Facilities"],
                "Financial Services": {
                    "Budgets and Reporting": ["Budgets"],
                    "Contracts and Supply Chain Management": ["Supply Chain"],
                    "Financial Services and Systems": ["Financial Systems"],
                    "Payroll Services": ["Payroll"],
                    "Research Accounting": ["Research Accounting"],
                    "Treasury Services": ["Treasury"]
                },
                // From unbc.ca's Operations page: Hospitality Services runs these two.
                "Hospitality Services": {
                    "Conference and Event Services": ["Conferences"],
                    "Food Services": ["Food"]
                },
                "Human Resources": ["Human Resources"],
                "Information Technology Services": {
                    "Administrative and Enterprise Systems": ["Enterprise Systems"],
                    "Client Services": ["Client Services"],
                    "Educational Media Services": ["Media Services"],
                    "Service Desk": ["Service Desk"],
                    "Infrastructure Services": ["Infrastructure"]
                },
                "Institutional Research": ["Institutional Research"],
                "Parking Services": ["Parking"],
                "Safety and Risk Management": ["Safety"],
                "Security": ["Security"]
            },
            "Vice-President, Research and Innovation": {
                "Alumni Relations": ["Alumni Relations"],
                "Communications and Marketing": ["Communications"],
                "Health Research Institute": ["HRI"],
                "Office of Research and Innovation": ["Research"],
                "Development": ["Development"]
            }
        }
    }
}

// Shorter names a unit's sub-logo is also issued under. These are opt-in, unlike the alias arrays
// above: an alias is only a search nickname, whereas each name here appears on an official sub-logo
// (the Library's own unbc.ca sub-logo reads just "Library").
export const departmentAlternateNames = {
    "Geoffrey R. Weller Library": ["Library"],
    // The Graphics Standards Manual's profile-image examples read "Graduate Programs".
    "Office of Graduate Programs": ["Graduate Programs"],
    // The Career Centre's sub-logo drops "Student".
    "Student Career Centre": ["Career Centre"]
}

// The name a unit's social-media avatar prints, where UNBC's own avatar differs from the default.
// By default an avatar prints the name as given, except that faculties drop "Faculty of"
// (see profileCaptionText); these are the avatars that have been checked and say otherwise.
export const departmentProfileNames = {
    // Drops "Faculty of", as the default does; recorded because the avatar has been checked.
    "Faculty of Indigenous Studies, Social Sciences and Humanities": "Indigenous Studies, Social Sciences and Humanities",
    // Keeps "Faculty of", and sets "and" as "&".
    "Faculty of Science and Engineering": "Faculty of Science & Engineering",
    // Drops "Department of", and sets "and" as "&".
    "Department of Geography, Earth and Environmental Sciences": "Geography, Earth & Environmental Sciences",
    // Sets "and" as "&".
    "Conference and Event Services": "Conference & Event Services"
}
