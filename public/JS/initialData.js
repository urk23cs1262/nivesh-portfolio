/* ==========================================================================
   NIVESH PORTFOLIO — INITIAL DATA FALLBACK ENGINE (JS/initialData.js)
   ========================================================================== */

(function () {
    'use strict';

    window.PORTFOLIO_INITIAL_DATA = {
      "about": {
        "name": "Nivesh R",
        "role": "CSE Student · Full Stack Developer · AI Enthusiast",
        "short_description": "B.Tech CSE student at Karunya Institute of Technology and Science. Building full-stack apps, AI-powered platforms & IoT systems.",
        "about_paragraph_1": "I'm a passionate B.Tech Computer Science student at Karunya Institute of Technology and Science (2023–27), specializing in building full-stack web applications, AI-powered platforms, and IoT systems.",
        "about_paragraph_2": "I love transforming ideas into working digital products — from PHP-MySQL school systems and React-based resume analyzers to ML-powered toll verification and real-time water monitoring platforms.",
        "hobbies": "Beyond coding, I enjoy listening to music, reading, and playing the drums.",
        "projects_count": "5+",
        "cgpa": "7.8",
        "graduation_year": "2027",
        "profile_image_url": "./assets/img/NIVESH R.jpg",
        "github_url": "https://github.com/theniveshr",
        "linkedin_url": "https://www.linkedin.com/in/nivesh-r-4646972b3",
        "instagram_url": "https://www.instagram.com/______.nivesh_arn.______/?hl=en",
        "email": "niveshr@karunya.edu.in"
      },
      "education": [
        {
          "id": "edu-1",
          "institution": "Karunya Institute of Technology and Science",
          "degree": "B.Tech in Computer Science and Engineering",
          "education_type": "College",
          "start_year": "2023",
          "end_year": "2027",
          "description": "Pursuing undergraduate degree with focus on software development, algorithms, web technologies, AI/ML, and IoT systems.",
          "score": "CGPA: 7.8 / 10",
          "logo_url": "assets/img/education/karunya.png",
          "display_order": 1,
          "is_active": true,
          "published": true
        },
        {
          "id": "edu-2",
          "institution": "Holy Spirit Matric Hr. Sec. School",
          "degree": "Higher Secondary Education (Tamil Nadu State Board)",
          "education_type": "Higher Secondary (12th)",
          "start_year": "2021",
          "end_year": "2023",
          "description": "Completed 12th grade with focus on Computer Science, Mathematics, and Physics.",
          "score": "Percentage: 86%",
          "logo_url": "assets/img/education/holy.png",
          "display_order": 2,
          "is_active": true,
          "published": true
        },
        {
          "id": "edu-3",
          "institution": "Holy Spirit Matric Hr. Sec. School",
          "degree": "Secondary Education (Tamil Nadu State Board)",
          "education_type": "Secondary (10th)",
          "start_year": "2019",
          "end_year": "2021",
          "description": "Completed 10th grade with exceptional academic performance.",
          "score": "Percentage: 100%",
          "logo_url": "assets/img/education/holy.png",
          "display_order": 3,
          "is_active": true,
          "published": true
        }
      ],
      "experiences": [
        {
          "id": "exp-1",
          "job_title": "Cybersecurity Intern",
          "organization": "Cisco Networking Academy",
          "program_name": "AICTE Virtual Internship Program",
          "start_date": "Jun 2024",
          "end_date": "Aug 2024",
          "location": "Remote",
          "work_type": "Remote",
          "description": "Configured and simulated enterprise network topologies using Cisco Packet Tracer, implementing routing, switching, VLANs and IP addressing, strengthening network security through industry best practices.",
          "technologies": [
            "Cisco Packet Tracer",
            "Routing & Switching",
            "VLANs",
            "IPv4/IPv6",
            "ACLs",
            "VPNs",
            "Firewalls",
            "SSH & HTTPS"
          ],
          "certificate_image_url": "assets/img/certificate/cisco-cyber-2024.png",
          "display_order": 1,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "exp-2",
          "job_title": "Cybersecurity Intern",
          "organization": "Cisco Networking Academy",
          "program_name": "AICTE Virtual Internship Program",
          "start_date": "Jun 2025",
          "end_date": "Aug 2025",
          "location": "Remote",
          "work_type": "Remote",
          "description": "Configured and secured enterprise networks using Cisco Packet Tracer, Routing, Switching, VLANs, IPv4/IPv6, ACLs, VPNs, Firewalls, SSH, and HTTPS, strengthening network security.",
          "technologies": [
            "Cisco Packet Tracer",
            "Routing & Switching",
            "VLANs",
            "IPv4/IPv6",
            "ACLs",
            "VPNs",
            "Firewalls",
            "SSH & HTTPS"
          ],
          "certificate_image_url": "assets/img/certificate/cisco-cyber-2025.png",
          "display_order": 2,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "exp-3",
          "job_title": "Web Development Intern",
          "organization": "CodSoft",
          "program_name": "Virtual Internship",
          "start_date": "Aug 2025",
          "end_date": "Sep 2025",
          "location": "Remote",
          "work_type": "Remote",
          "description": "Developed responsive web applications and interactive frontend projects using HTML, CSS, JavaScript, Git, and GitHub, applying modern web development and responsive design principles.",
          "technologies": [
            "HTML5",
            "CSS3",
            "JavaScript",
            "Git",
            "GitHub",
            "Responsive Design"
          ],
          "certificate_image_url": "assets/img/certificate/codsoft_intern_cer.png",
          "display_order": 3,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        }
      ],
      "skillCategories": [
        {
          "id": "cat-1",
          "name": "Programming",
          "icon": "fas fa-code",
          "display_order": 1,
          "is_active": true,
          "published": true,
          "skills": [
            "Python"
          ]
        },
        {
          "id": "cat-2",
          "name": "Frontend",
          "icon": "fas fa-layer-group",
          "display_order": 2,
          "is_active": true,
          "published": true,
          "skills": [
            "HTML5",
            "CSS3",
            "JavaScript",
            "React"
          ]
        },
        {
          "id": "cat-3",
          "name": "Backend",
          "icon": "fas fa-server",
          "display_order": 3,
          "is_active": true,
          "published": true,
          "skills": [
            "Node.js",
            "Express.js",
            "FastAPI",
            "Flask"
          ]
        },
        {
          "id": "cat-4",
          "name": "Databases",
          "icon": "fas fa-database",
          "display_order": 4,
          "is_active": true,
          "published": true,
          "skills": [
            "MySQL",
            "MongoDB"
          ]
        },
        {
          "id": "cat-5",
          "name": "AI / ML",
          "icon": "fas fa-brain",
          "display_order": 5,
          "is_active": true,
          "published": true,
          "skills": [
            "Random Forest",
            "Isolation Forest",
            "YOLO",
            "PaddleOCR",
            "Gemini API",
            "Llama 3.1"
          ]
        },
        {
          "id": "cat-6",
          "name": "DevOps & Tools",
          "icon": "fas fa-tools",
          "display_order": 6,
          "is_active": true,
          "published": true,
          "skills": [
            "Docker",
            "Kubernetes",
            "VS Code",
            "GitHub Actions",
            "Prometheus",
            "Grafana"
          ]
        },
        {
          "id": "cat-7",
          "name": "IoT / Embedded",
          "icon": "fas fa-microchip",
          "display_order": 7,
          "is_active": true,
          "published": true,
          "skills": [
            "NodeMCU (ESP8266)",
            "Arduino",
            "I2C LCD",
            "Sensors"
          ]
        },
        {
          "id": "cat-8",
          "name": "CS Fundamentals",
          "icon": "fas fa-book-open",
          "display_order": 8,
          "is_active": true,
          "published": true,
          "skills": [
            "DSA",
            "DBMS",
            "Oops",
            "Operating Systems"
          ]
        }
      ],
      "projects": [
        {
          "id": "proj-1",
          "name": "NEUROHIRE AI",
          "icon": "🤖",
          "short_description": "Enterprise AI recruitment platform with resume intelligence, ATS scoring, adaptive interviews, multimodal candidate evaluation, and AI-powered hiring recommendations.",
          "long_description": "Enterprise AI recruitment platform built with Next.js, FastAPI, PostgreSQL, LangGraph, and Gemini. Features RAG-powered resume parsing and candidate ranking.",
          "github_url": "https://github.com/theniveshr/NeuroHire.git",
          "live_demo_url": "",
          "image_url": "",
          "images": [],
          "technologies": [
            "Next.js",
            "FastAPI",
            "PostgreSQL",
            "LangGraph",
            "Gemini"
          ],
          "status": "Currently Developing",
          "display_order": 1,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "AI / ML"
        },
        {
          "id": "proj-2",
          "name": "St. John de Britto Church Website",
          "icon": "⛪",
          "short_description": "Developing a modern and responsive Roman Catholic church website with multilingual support, daily Bible readings, saint of the day, donation system, and admin panel.",
          "long_description": "Full-stack parish web platform featuring announcements, daily readings, donation integration, and localized church administration.",
          "github_url": "https://github.com/urk23cs1262/stjb_church.git",
          "live_demo_url": "https://st-jb-church.vercel.app",
          "image_url": "",
          "images": [],
          "technologies": [
            "React.js",
            "Node.js",
            "Express.js",
            "MongoDB",
            "JWT",
            "Vercel"
          ],
          "status": "Currently Developing",
          "display_order": 2,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "Web Development"
        },
        {
          "id": "proj-3",
          "name": "Smart-Tag",
          "icon": "🚗",
          "short_description": "ML-based toll verification and fraud detection system using YOLO for vehicle detection and PaddleOCR for license plate recognition with a Flask dashboard.",
          "long_description": "Computer vision toll automation pipeline leveraging YOLO object detection and PaddleOCR text extraction for automated plate scanning and fraud prevention.",
          "github_url": "https://github.com/theniveshr/SMART-TAG.git",
          "live_demo_url": "",
          "image_url": "",
          "images": [],
          "technologies": [
            "YOLO",
            "PaddleOCR",
            "Flask",
            "Python",
            "CV"
          ],
          "status": "Completed",
          "display_order": 3,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "AI / Computer Vision"
        },
        {
          "id": "proj-4",
          "name": "CAREERARC",
          "icon": "📄",
          "short_description": "AI Resume Intelligence Platform with ATS scoring, job matching, and content optimization. Full-stack app using React, Node.js, Express, and MongoDB.",
          "long_description": "Comprehensive ATS analyzer and resume building platform integrated with Llama 3.1 & Gemini APIs to deliver detailed keyword optimization feedback.",
          "github_url": "https://github.com/theniveshr/CareerArc.git",
          "live_demo_url": "",
          "image_url": "",
          "images": [],
          "technologies": [
            "React",
            "Node.js",
            "MongoDB",
            "Llama 3.1",
            "Gemini"
          ],
          "status": "Completed",
          "display_order": 4,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "Full Stack"
        },
        {
          "id": "proj-5",
          "name": "HydroWatch",
          "icon": "💧",
          "short_description": "AI-powered real-time water pipeline monitoring platform. Random Forest & Isolation Forest models detect leaks and anomalies with ~94% accuracy.",
          "long_description": "IoT telemetry analysis platform using FastAPI, Prometheus, Grafana, and Docker/Kubernetes container orchestration.",
          "github_url": "https://github.com/theniveshr/HydroWatch.git",
          "live_demo_url": "",
          "image_url": "",
          "images": [],
          "technologies": [
            "FastAPI",
            "Python",
            "Prometheus",
            "Grafana",
            "Docker",
            "K8s"
          ],
          "status": "Completed",
          "display_order": 5,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "DevOps & AI"
        },
        {
          "id": "proj-6",
          "name": "Lost & Found Hub",
          "icon": "🔍",
          "short_description": "Full-stack Lost & Found portal with secure user authentication, item posting, and search/filter features. Integrated EmailJS for automated email notifications.",
          "long_description": "Community platform with real-time match alerts sent via EmailJS when reported items correspond to newly listed items.",
          "github_url": "https://github.com/theniveshr/lost-found_hub.git",
          "live_demo_url": "",
          "image_url": "",
          "technologies": [
            "Node.js",
            "MySQL",
            "EmailJS",
            "JavaScript"
          ],
          "status": "Completed",
          "display_order": 6,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "Web Development"
        },
        {
          "id": "proj-7",
          "name": "Smart Study Reminder",
          "icon": "⏰",
          "short_description": "IoT-based Smart Study Reminder using NodeMCU (ESP8266), tilt sensor, buzzer, and I2C LCD. Implements automated study–break cycles with posture detection.",
          "long_description": "Embedded C++ hardware system tracking study session length and alerting user upon posture drift or needed break intervals.",
          "github_url": "https://github.com/theniveshr/SMART-STUDY-REMINDER.git",
          "live_demo_url": "",
          "image_url": "",
          "technologies": [
            "IoT",
            "NodeMCU",
            "ESP8266",
            "C++"
          ],
          "status": "Completed",
          "display_order": 7,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "IoT"
        },
        {
          "id": "proj-8",
          "name": "ReconAI PRO",
          "icon": "🛡️",
          "short_description": "AI-powered bug bounty reconnaissance assistant using the Google Gemini API. Structured prompts generate vulnerability insights based on OWASP principles.",
          "long_description": "Automated security reconnaissance assistant facilitating quick vulnerability taxonomy matching and OWASP Top 10 evaluation.",
          "github_url": "https://github.com/theniveshr/ReconAI-Pro.git",
          "live_demo_url": "",
          "image_url": "",
          "technologies": [
            "Gemini API",
            "Node.js",
            "Express.js",
            "OWASP"
          ],
          "status": "Completed",
          "display_order": 8,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "Cybersecurity & AI"
        },
        {
          "id": "proj-9",
          "name": "School Management System",
          "icon": "🏫",
          "short_description": "Comprehensive PHP-MySQL web application for educational institutions. Streamlines admissions, course management, and faculty administration.",
          "long_description": "Dynamic PHP portal managing student records, grade reports, class schedules, and administrative operations.",
          "github_url": "https://github.com/urk23cs1262/school-management-system",
          "live_demo_url": "",
          "image_url": "",
          "technologies": [
            "PHP",
            "MySQL",
            "HTML/CSS",
            "JavaScript"
          ],
          "status": "Completed",
          "display_order": 9,
          "is_active": true,
          "published": true,
          "publish_status": "Published",
          "category": "Web Development"
        }
      ],
      "certificates": [
        {
          "id": "cert-1",
          "title": "AWS Cloud Practitioner Essentials",
          "issuer": "AWS",
          "issue_date": "March 2026",
          "description": "Foundational knowledge of AWS Cloud platform, including basic global infrastructure, security, compliance, and core services.",
          "certificate_image_url": "assets/img/certificate/aws-practitioner.png",
          "credential_id": "",
          "credential_url": "",
          "icon": "🎨",
          "category": "Cloud",
          "display_order": 1,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "cert-2",
          "title": "Oracle Cloud Infrastructure 2025 Data Science",
          "issuer": "Oracle University",
          "issue_date": "Sept 2025",
          "description": "Certified Data Science Professional, demonstrating expertise in using OCI Data Science to build, train, manage, and deploy machine learning models.",
          "certificate_image_url": "assets/img/certificate/oracle-data-science.png",
          "credential_id": "",
          "credential_url": "",
          "icon": "📊",
          "category": "Data Science",
          "display_order": 2,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "cert-3",
          "title": "Microsoft Azure Fundamentals",
          "issuer": "Microsoft",
          "issue_date": "April 2026",
          "description": "Demonstrated foundational knowledge of cloud services and how those services are provided with Microsoft Azure.",
          "certificate_image_url": "assets/img/certificate/azure-fundamentals.png",
          "credential_id": "",
          "credential_url": "",
          "icon": "🔷",
          "category": "Cloud",
          "display_order": 3,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "cert-4",
          "title": "Microsoft Azure Data Fundamentals",
          "issuer": "Microsoft",
          "issue_date": "September 2025",
          "description": "Successfully completed Azure Data Fundamentals certification, demonstrating foundational knowledge of core data concepts and Microsoft Azure data services.",
          "certificate_image_url": "assets/img/certificate/microsoft_certificate.png",
          "credential_id": "",
          "credential_url": "",
          "icon": "💎",
          "category": "Cloud",
          "display_order": 4,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "cert-5",
          "title": "Ethical Hacker",
          "issuer": "Cisco Networking Academy",
          "issue_date": "April 2026",
          "description": "Successfully completed the Ethical Hacker course, covering reconnaissance, attacks, and securing networks through the Cisco Networking Academy program.",
          "certificate_image_url": "assets/img/certificate/cisco-ethical-hacker.png",
          "credential_id": "",
          "credential_url": "",
          "icon": "💀",
          "category": "Cybersecurity",
          "display_order": 5,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        }
      ],
      "activities": [
        {
          "id": "act-1",
          "title": "Smart India Hackathon (SIH)",
          "organization": "Ministry of Education & AICTE",
          "description": "Participated in a national-level innovation hackathon, collaborating with a multidisciplinary team to design and develop a technology-driven solution for a real-world problem within a competitive development timeline.",
          "year": "2025",
          "participation_type": "Participant",
          "badge": "National Hackathon",
          "certificate_image_url": "assets/img/certificate/sih_certificate.jpeg",
          "event_image_url": "",
          "external_url": "",
          "display_order": 1,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        },
        {
          "id": "act-2",
          "title": "G-K Hackathon – Digital Campus 2.0",
          "organization": "Google Cloud #HackSprint",
          "description": "Collaborated with a team to conceptualize, develop, and present a cloud-based solution, applying problem-solving, software development, and presentation skills in a competitive hackathon environment.",
          "year": "2025",
          "participation_type": "Participant",
          "badge": "Cloud Hackathon",
          "certificate_image_url": "assets/img/certificate/g-hacks.png",
          "event_image_url": "",
          "external_url": "",
          "display_order": 2,
          "is_active": true,
          "published": true,
          "publish_status": "Published"
        }
      ],
      "contact": {
        "email": "niveshr@karunya.edu.in",
        "phone": "+91 7639520006",
        "location": "Kalaiyarkovil, Sivagangai, Tamil Nadu",
        "contact_heading": "Have a project in mind?",
        "contact_description": "I'm open to internships, collaboration, and freelance opportunities. Feel free to reach out — I'd love to connect!",
        "form_heading": "Get In Touch",
        "form_button_text": "Send Message"
      },
      "socialLinks": [
        {
          "id": "soc-1",
          "platform_name": "GitHub",
          "url": "https://github.com/theniveshr",
          "icon": "fab fa-github",
          "is_active": true,
          "display_order": 1
        },
        {
          "id": "soc-2",
          "platform_name": "LinkedIn",
          "url": "https://www.linkedin.com/in/nivesh-r-4646972b3",
          "icon": "fab fa-linkedin",
          "is_active": true,
          "display_order": 2
        },
        {
          "id": "soc-3",
          "platform_name": "Instagram",
          "url": "https://www.instagram.com/______.nivesh_arn.______/?hl=en",
          "icon": "fab fa-instagram",
          "is_active": true,
          "display_order": 3
        },
        {
          "id": "soc-4",
          "platform_name": "Email",
          "url": "mailto:niveshr@karunya.edu.in",
          "icon": "fas fa-envelope",
          "is_active": true,
          "display_order": 4
        }
      ],
      "resume": {
        "id": "res-1",
        "filename": "NIVESH_R_RESUME.pdf",
        "file_size": "172 KB",
        "upload_date": "14 Aug 2026",
        "url": "assets/pdf/resume/NIVESH_R_RESUME.pdf",
        "data_url": "assets/pdf/resume/NIVESH_R_RESUME.pdf",
        "is_active": true
      },
      "navigation": [
        {
          "id": "nav-1",
          "name": "About",
          "section_id": "about",
          "display_order": 1,
          "is_active": true
        },
        {
          "id": "nav-2",
          "name": "Education",
          "section_id": "education",
          "display_order": 2,
          "is_active": true
        },
        {
          "id": "nav-3",
          "name": "Experience",
          "section_id": "experience",
          "display_order": 3,
          "is_active": true
        },
        {
          "id": "nav-4",
          "name": "Skills",
          "section_id": "skills",
          "display_order": 4,
          "is_active": true
        },
        {
          "id": "nav-5",
          "name": "Projects",
          "section_id": "projects",
          "display_order": 5,
          "is_active": true
        },
        {
          "id": "nav-6",
          "name": "Certificates",
          "section_id": "certificates",
          "display_order": 6,
          "is_active": true
        },
        {
          "id": "nav-7",
          "name": "Activities",
          "section_id": "activities",
          "display_order": 7,
          "is_active": true
        },
        {
          "id": "nav-8",
          "name": "Contact",
          "section_id": "contact",
          "display_order": 8,
          "is_active": true
        },
        {
          "id": "nav-9",
          "name": "Admin",
          "section_id": "admin.html",
          "display_order": 9,
          "is_active": true
        }
      ],
      "lastUpdated": "2026-08-12T22:41:00.000Z"
    };
})();
