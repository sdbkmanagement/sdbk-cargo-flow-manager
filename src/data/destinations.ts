
export interface Destination {
  ville: string;
  stations: string[];
}

export interface Client {
  nom: string;
  ville: string;
  type: 'ville' | 'station' | 'entreprise';
}

export const DESTINATIONS: Destination[] = [
  {
    ville: "Beyla",
    stations: ["Station Beyla Donzo"]
  },
  {
    ville: "Boffa",
    stations: ["Ashapura Boffa", "Chalco Guineea", "Chec Boffa", "Rouge Minig", "Station Boffa Bollonde", "Station Boffa Torodoya"]
  },
  {
    ville: "Boke",
    stations: ["Henanchine", "Station Boke Yomboya", "Dabis"]
  },
  {
    ville: "Cissela",
    stations: ["Station Cissela 1", "Station Cissela 2"]
  },
  {
    ville: "Conakry",
    stations: [
      "ACCG", "Alame SARL", "Beverage", "CBK Simbaya", "Conakry Terminal", "Domino", "Fortune Construction", "Huillerie de Guinee", 
      "Sobragui", "Sogeac", "Station Mafanco", "Station Madina Koumi", "Station Belle Vue", "Station Camayenne",
      "Station Carriere", "Station Cimenterie", "Station Cosa2", "Station Coyah Somayah", 
      "Station Coyah Wonkifong", "Station Dabondi", "Station Dabondy", "Station Dixinn Ecole", 
      "Station Gare Routiere", "Station Hamdallaye Deflendre", "Station Hamdallaye Marcket", 
      "Station Kagbeling Village", "Station Kissosso", "Station Koloma", "Station Lambanyi", 
      "Station Lansanayah", "Station Le Prince Nana", "Station Lycee Français", "Station Maneah", 
      "Station Maneyah", "Station Matam", "Station Matam Corniche", "Station Miniere", 
      "Station Sangoyah", "Station Sans Fil", "Station Sig Madina", "Station Sonfonia", 
      "Station Symbaya", "Station T10 Keitaya", "Station T2 Kipe", "Station T3 Cosa",
      "Station T3 Cosa Le Prince", "Station T5 Kobaya", "Station T5 Wanindara", "Station T6 Yataya",
      "Station T6 Yattaya", "Station Tanneri", "Station Taouyah Petit Lac", "Station Tombolia", 
      "Station Total Belle Vue", "Station Total Sanoyah", "Station Total T1 Concasseur", "Station Total Taouyah Petit Lac", 
      "Station Wassa Wassa", "Station Yimbaya Rp", "Station Total Dixin Oasis", 
      "Station Total Matoto Mosquée", "Station Total Ratoma"
    ]
  },
  {
    ville: "Dabola",
    stations: ["Station Dabola Marche", "Station Dabola Route Kouroussa", "Station Dabola Ymc1", "Station Dabola Ymc2"]
  },
  {
    ville: "Dalaba",
    stations: ["Station Dalaba"]
  },
  {
    ville: "Dinguiraye",
    stations: ["Dinguiraye"]
  },
  {
    ville: "Debele",
    stations: ["Cbk Debele"]
  },
  {
    ville: "Diecke",
    stations: ["Soguipa"]
  },
  {
    ville: "Dian Dian",
    stations: ["Cobad Dian Dian"]
  },
  {
    ville: "Faranah",
    stations: ["Station Faranah", "Station Faranah ymc"]
  },
  {
    ville: "Forecariah",
    stations: ["Kaleah", "Setc Forecariah"]
  },
  {
    ville: "Fria",
    stations: ["Rouge Minig", "Station Fria Economat"]
  },
  {
    ville: "Gbantama",
    stations: ["Station Gbantama"]
  },
  {
    ville: "Gomboya",
    stations: ["Beverage"]
  },
  {
    ville: "Gueckedou",
    stations: ["Station Gueckedou Carriere", "Station Gueckedou Gare Routiere"]
  },
  {
    ville: "Kamsar",
    stations: ["Station Kamsar Barrage", "Station Kamsar Commissariat", "Station Kamsar Filima"]
  },
  {
    ville: "Kankan",
    stations: [
      "Guineenne de Terrassement", "SGP Kankan", "Station Kankan Gare Routiere",
      "Station Kankan Grand Marche", "Station Kankan Grande Mosque", "Station Kankan Koura",
      "Station Kankan Mbalia", "Station Kankan Sinkefara", "Station Kankan Timbo",
      "Station Kankan Yes", "Station Kankan YMC"
    ]
  },
  {
    ville: "Kérouané",
    stations: ["Simfer Cr18 Camp1 Keroune"]
  },
  {
    ville: "Kindia",
    stations: ["Station Friguiagbe", "Station Kindia Samoroya", "Station Total Friguiagbe", "Station Total Foulaya", "EIFFAGE"]
  },
  {
    ville: "Kissidougou",
    stations: ["Kissidougou Route Nzerekore", "Kissidougou YMC2", "Station Kissidougou Centre", "Station Kissidougou Ymc1"]
  },
  {
    ville: "Kolaboui",
    stations: ["Kolaboui Mansalaya", "Kolaboui Minex", "Station Kolaboui", "Station Kolaboui Mansalaya", "Station Kolaboui Mansalayah", "Station Kolaboui Niankalia"]
  },
  {
    ville: "Koundara",
    stations: ["Station Koundara", "Station Koundara Donzo"]
  },
  {
    ville: "Kouroussa",
    stations: ["Station Kouroussa", "Station Kouroussa G", "Videri Entreprises SARL"]
  },
  {
    ville: "Labe",
    stations: ["Station Labe Centre", "Station Labe Donghora", "Station Labe Safatou", "Station Labe Tourisme", "Station Total Labe Safatou", "Stationt Total Labe Safatou", "EIFFAGE"]
  },
  {
    ville: "Lelouma",
    stations: ["CGC Lafou", "CGC Thiaguel Bori"]
  },
  {
    ville: "Loila",
    stations: ["Smm Mandianna", "Station Loila"]
  },
  {
    ville: "Macenta",
    stations: ["YMC", "Macenta C"]
  },
  {
    ville: "Lola",
    stations: ["Gajah Investiment Guinea", "Station Lola"]
  },
  {
    ville: "Maferenya",
    stations: ["Beverage", "Client Divers au comptant"]
  },
  {
    ville: "Mamou",
    stations: ["Station Mamou B", "Station Mamou C", "Station Mamou Carrefour", "Station Mamou Contournante", "Station Mamou D", "Station Mamou Holo", "Station Total Mamou D"]
  },
  {
    ville: "Mandiana",
    stations: ["Station Mandiana 2"]
  },
  {
    ville: "Niagassola",
    stations: ["PL Niagassola Wely Mining", "Wely Mining"]
  },
  {
    ville: "N'zerekore",
    stations: [
      "Foret Forte", "N'zezkore Dalein", "Sgp N'Zerekore", "Station N'Zerekore Boma Ymc",
      "Station N'zerekore Dorota", "Station N'Zerekore Gr", "Station N'zerekore Horoya",
      "Station N'zerekore Mosque", "Station N'zerekore Tawu Tama", "Station N'zerekore YMC",
      "Station Total N'zerekore YMC", "SGESCO", "SOGUPAH"
    ]
  },
  {
    ville: "Pita",
    stations: ["Station Pita Marketing", "Station Pita Parc"]
  },
  {
    ville: "Sangaredi",
    stations: ["Ashapura Minex", "Station Sangaredi"]
  },
  {
    ville: "Siguiri",
    stations: ["Station Siguiri Didi Gare", "Station Siguiri Koro", "Station Siguiri Ouba Cisse", "Station Siguiri YMC", "Station Total Siguiri Didi Gare", "Station Total Siguiri Koro", "Station Total Siguiri Ouba Cisse"]
  },
  {
    ville: "Tanene",
    stations: ["Ashapura", "Station Tanene", "Tanene Continental groupe"]
  },
  {
    ville: "Taressa",
    stations: ["Cobad Taressa"]
  },
  {
    ville: "Telemele",
    stations: ["Station Telimele", "Rouge Mining"]
  },
  {
    ville: "Tougue",
    stations: ["Station Tougue"]
  },
  {
    ville: "Yende",
    stations: ["Station Yende"]
  }
];

export const getAllClients = (): Client[] => {
  const clients: Client[] = [];
  
  DESTINATIONS.forEach(destination => {
    // Ajouter la ville
    clients.push({
      nom: destination.ville,
      ville: destination.ville,
      type: 'ville'
    });
    
    // Ajouter toutes les stations
    destination.stations.forEach(station => {
      clients.push({
        nom: station,
        ville: destination.ville,
        type: station.toLowerCase().includes('station') || station.toLowerCase().includes('cbk') || station.toLowerCase().includes('sgp') ? 'station' : 'entreprise'
      });
    });
  });
  
  return clients.sort((a, b) => a.nom.localeCompare(b.nom));
};

export const getClientsByVille = (ville: string): Client[] => {
  return getAllClients().filter(client => client.ville === ville);
};

export const searchClients = (query: string): Client[] => {
  if (!query) return getAllClients();
  
  return getAllClients().filter(client => 
    client.nom.toLowerCase().includes(query.toLowerCase()) ||
    client.ville.toLowerCase().includes(query.toLowerCase())
  );
};
