export const DEMO_PILOTS = [
  { id: "demo-p1", name: "Sven Svensson", country: "SE", club: "Stockholm RC", email: "sven@demo.se", phone: "+46 70 123 4567", license: "SWE-001", address: "" },
  { id: "demo-p2", name: "Anders Andersson", country: "SE", club: "Gothenburg Flyers", email: "anders@demo.se", phone: "+46 70 234 5678", license: "SWE-002", address: "" },
  { id: "demo-p3", name: "Johan Johansson", country: "SE", club: "Malmö Aero", email: "johan@demo.se", phone: "+46 70 345 6789", license: "SWE-003", address: "" },
  { id: "demo-p4", name: "Per Persson", country: "SE", club: "Uppsala RC", email: "per@demo.se", phone: "+46 70 456 7890", license: "SWE-004", address: "" },
  { id: "demo-p5", name: "Karl Karlsson", country: "SE", club: "Västerås Aviators", email: "karl@demo.se", phone: "+46 70 567 8901", license: "SWE-005", address: "" },
  { id: "demo-p6", name: "Lars Larsson", country: "SE", club: "Örebro RC", email: "lars@demo.se", phone: "+46 70 678 9012", license: "SWE-006", address: "" },
  { id: "demo-p7", name: "Erik Eriksson", country: "SE", club: "Linköping RC", email: "erik@demo.se", phone: "+46 70 789 0123", license: "SWE-007", address: "" },
  { id: "demo-p8", name: "Mats Matsson", country: "SE", club: "Helsingborg Flyers", email: "mats@demo.se", phone: "+46 70 890 1234", license: "SWE-008", address: "" },
  { id: "demo-p9", name: "Nils Nilsson", country: "SE", club: "Jönköping RC", email: "nils@demo.se", phone: "+46 70 901 2345", license: "SWE-009", address: "" },
  { id: "demo-p10", name: "Olof Olofsson", country: "SE", club: "Norrköping Aero", email: "olof@demo.se", phone: "+46 70 012 3456", license: "SWE-010", address: "" },
  { id: "demo-p11", name: "Björn Björnsson", country: "SE", club: "Lund Flyers", email: "bjorn@demo.se", phone: "+46 70 111 2222", license: "SWE-011", address: "" }
];

export const DEMO_AIRCRAFT = [
  // Sven Svensson (demo-p1)
  { id: "demo-a1", pilotId: "demo-p1", name: "Fokker Dr.I", className: "WWI", engine: "Combustion", engineModel: "O.S. 15LA", battery: "", propeller: "8x4", techStatus: "approved", modelPoints: { fourStroke: false, multiwing: true, ribStructure: true, onboardPilot: true, weapons: true, riggingStruts: false } },
  { id: "demo-a2", pilotId: "demo-p1", name: "Spitfire Mk IX", className: "WWII", engine: "Electric", engineModel: "Turnigy", battery: "3S 1300mAh", propeller: "9x5", techStatus: "approved" },
  // Anders Andersson (demo-p2)
  { id: "demo-a3", pilotId: "demo-p2", name: "Sopwith Camel", className: "WWI", engine: "Electric", engineModel: "", battery: "3S 1500mAh", propeller: "10x4", techStatus: "approved", modelPoints: { fourStroke: false, multiwing: true, ribStructure: false, onboardPilot: true, weapons: true, riggingStruts: true } },
  { id: "demo-a4", pilotId: "demo-p2", name: "Bf 109", className: "WWII", engine: "Combustion", engineModel: "O.S. 25FX", battery: "", propeller: "9x6", techStatus: "approved" },
  // Johan Johansson (demo-p3)
  { id: "demo-a5", pilotId: "demo-p3", name: "P-51 Mustang", className: "WWII", engine: "Combustion", engineModel: "O.S. 15LA", battery: "", propeller: "8x4", techStatus: "approved" },
  // Per Persson (demo-p4)
  { id: "demo-a6", pilotId: "demo-p4", name: "Fw 190", className: "WWII", engine: "Electric", engineModel: "Hacker A30", battery: "4S 1800mAh", propeller: "8x6", techStatus: "approved" },
  { id: "demo-a7", pilotId: "demo-p4", name: "Nieuport 17", className: "WWI", engine: "Combustion", engineModel: "Saito FA-30", battery: "", propeller: "9x5", techStatus: "approved", modelPoints: { fourStroke: true, multiwing: true, ribStructure: true, onboardPilot: false, weapons: true, riggingStruts: true } },
  // Karl Karlsson (demo-p5)
  { id: "demo-a8", pilotId: "demo-p5", name: "Yak-9", className: "WWII", engine: "Combustion", engineModel: "Enya 15", battery: "", propeller: "8x4", techStatus: "approved" },
  // Lars Larsson (demo-p6)
  { id: "demo-a9", pilotId: "demo-p6", name: "Bristol Scout", className: "WWI", engine: "Electric", engineModel: "NTM Prop Drive", battery: "3S 2200mAh", propeller: "10x5", techStatus: "approved", modelPoints: { fourStroke: false, multiwing: true, ribStructure: false, onboardPilot: false, weapons: true, riggingStruts: true } },
  { id: "demo-a10", pilotId: "demo-p6", name: "A6M Zero", className: "WWII", engine: "Combustion", engineModel: "O.S. 25LA", battery: "", propeller: "9x4", techStatus: "approved" },
  // Erik Eriksson (demo-p7)
  { id: "demo-a11", pilotId: "demo-p7", name: "Ilyushin Il-2", className: "WWII", engine: "Electric", engineModel: "", battery: "4S 2200mAh", propeller: "9x6", techStatus: "approved" },
  // Mats Matsson (demo-p8)
  { id: "demo-a12", pilotId: "demo-p8", name: "Fokker D.VII", className: "WWI", engine: "Combustion", engineModel: "O.S. 25", battery: "", propeller: "10x4", techStatus: "approved", modelPoints: { fourStroke: false, multiwing: true, ribStructure: true, onboardPilot: true, weapons: false, riggingStruts: true } },
  // Nils Nilsson (demo-p9)
  { id: "demo-a13", pilotId: "demo-p9", name: "P-47 Thunderbolt", className: "WWII", engine: "Combustion", engineModel: "O.S. 15", battery: "", propeller: "8x4", techStatus: "approved" },
  // Olof Olofsson (demo-p10)
  { id: "demo-a14", pilotId: "demo-p10", name: "Spad XIII", className: "WWI", engine: "Electric", engineModel: "Turnigy", battery: "3S 1300mAh", propeller: "9x5", techStatus: "approved", modelPoints: { fourStroke: false, multiwing: true, ribStructure: true, onboardPilot: true, weapons: true, riggingStruts: true } },
  { id: "demo-a15", pilotId: "demo-p10", name: "Bf 109", className: "WWII", engine: "Electric", engineModel: "Turnigy", battery: "3S 1300mAh", propeller: "9x5", techStatus: "approved" },
  // Björn Björnsson (demo-p11)
  { id: "demo-a16", pilotId: "demo-p11", name: "Hurricane", className: "WWII", engine: "Combustion", engineModel: "O.S. 15", battery: "", propeller: "8x4", techStatus: "approved" }
];
