const messageInput = document.getElementById("message");
const boutonEnvoyer = document.getElementById("envoyer");
const conversation = document.getElementById("conversation");


// ==================================================
// MÉMOIRE
// ==================================================

let memoire = JSON.parse(
    localStorage.getItem("tyroneMemoire")
) || {
    prenom: null,
    nom: null,
    age: null,
    sujet: null
};

let historique = JSON.parse(
    localStorage.getItem("tyroneHistorique")
) || [];


// ==================================================
// SAUVEGARDE
// ==================================================

function sauvegarder() {
    localStorage.setItem(
        "tyroneMemoire",
        JSON.stringify(memoire)
    );

    localStorage.setItem(
        "tyroneHistorique",
        JSON.stringify(historique)
    );
}


// ==================================================
// AFFICHAGE
// ==================================================

function ajouterMessage(texte, auteur) {

    const message = document.createElement("div");

    message.className = `message ${auteur}`;
    message.textContent = texte;

    conversation.appendChild(message);

    conversation.scrollTop =
        conversation.scrollHeight;
}

function chargerHistorique() {

    historique.forEach(message => {
        ajouterMessage(
            message.texte,
            message.auteur
        );
    });
}


// ==================================================
// NORMALISATION DU TEXTE
// ==================================================

function normaliser(texte) {

    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’']/g, " ")
        .replace(/[?!.,;:"]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


// ==================================================
// DISTANCE ENTRE LES MOTS
// ==================================================

function distance(a, b) {

    const matrice = Array.from(
        { length: b.length + 1 },
        (_, i) => [i]
    );

    for (let j = 1; j <= a.length; j++) {
        matrice[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

            matrice[i][j] =
                b[i - 1] === a[j - 1]
                    ? matrice[i - 1][j - 1]
                    : Math.min(
                        matrice[i - 1][j - 1] + 1,
                        matrice[i][j - 1] + 1,
                        matrice[i - 1][j] + 1
                    );
        }
    }

    return matrice[b.length][a.length];
}


// ==================================================
// MOTS QUE TYRONE CONNAÎT
// ==================================================

const motsConnus = [
    "heure",
    "horloge",
    "temps",
    "actuelle",

    "date",
    "jour",
    "aujourd",
    "aujourdhui",

    "salut",
    "bonjour",
    "hello",
    "coucou",

    "merci",

    "aide",
    "aider",

    "aurevoir",
    "bientot",
    "bye",

    "presente",
    "parle",

    "connait",
    "connais",

    "donne",
    "quelle",

    "peux",
    "peut",

    "prenom",
    "comment",
    "appelle",
    "mappelle",

    "calcul",
    "calcule",
    "combien",
    "font",

    "fois",
    "moins",
    "plus",
    "divise",
    "multiplie"
];


// ==================================================
// CORRECTION DES FAUTES
// ==================================================

function corriger(texte) {

    return texte.split(" ").map(mot => {

        // On ne touche pas aux nombres
        if (/^[0-9]+$/.test(mot)) {
            return mot;
        }

        // On évite de modifier les mots très courts
        if (mot.length < 3) {
            return mot;
        }

        let meilleur = mot;
        let meilleureDistance = Infinity;

        for (const connu of motsConnus) {

            if (connu.length < 3) {
                continue;
            }

            const d = distance(mot, connu);

            if (d < meilleureDistance) {
                meilleureDistance = d;
                meilleur = connu;
            }
        }

        // Mots longs : jusqu'à 2 fautes
        // Mots courts : 1 seule faute
        const seuil =
            mot.length >= 6 ? 2 : 1;

        return meilleureDistance <= seuil
            ? meilleur
            : mot;

    }).join(" ");
}


// ==================================================
// OUTILS
// ==================================================

function contient(texte, mots) {

    return mots.some(
        mot => texte.includes(mot)
    );
}


// ==================================================
// MÉMOIRE DU PRÉNOM
// ==================================================

function gererPrenom(texte) {

    const match = texte.match(
        /je (?:m appelle|mappelle) ([a-zà-ÿ-]+)/
    );

    if (match) {

        memoire.prenom = match[1];

        sauvegarder();

        return (
            "D'accord, je retiens que tu t'appelles " +
            memoire.prenom +
            "."
        );
    }

    if (
        texte.includes("comment je m appelle") ||
        texte.includes("comment je mappelle") ||
        texte.includes("quel est mon prenom") ||
        texte.includes("tu connais mon prenom")
    ) {

        if (memoire.prenom) {

            return (
                "Tu t'appelles " +
                memoire.prenom +
                "."
            );
        }

        return "Je ne connais pas encore ton prénom.";
    }

    return null;
}


// ==================================================
// CALCULATRICE
// ==================================================

function calculer(expression) {

    expression = expression
        .replace(/multiplie par/g, "*")
        .replace(/divise par/g, "/")
        .replace(/plus/g, "+")
        .replace(/moins/g, "-")
        .replace(/fois/g, "*");

    // Autorise uniquement les caractères mathématiques
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        return null;
    }

    try {

        const resultat = Function(
            `"use strict"; return (${expression})`
        )();

        return Number.isFinite(resultat)
            ? resultat
            : null;

    } catch {

        return null;
    }
}


function trouverCalcul(texte) {

    const match = texte.match(
        /(?:combien font|combien fait|calcule|calcul|fais le calcul)\s+(.+)/
    );

    if (!match) {
        return null;
    }

    const resultat = calculer(
        match[1]
    );

    if (resultat === null) {
        return null;
    }

    return (
        "Le résultat est " +
        resultat +
        "."
    );
}


// ==================================================
// DATE / HEURE
// ==================================================

function obtenirHeure() {

    return (
        "Il est " +
        new Date().toLocaleTimeString(
            "fr-FR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        ) +
        "."
    );
}


function obtenirDate() {

    return (
        "Nous sommes le " +
        new Date().toLocaleDateString(
            "fr-FR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ) +
        "."
    );
}


// ==================================================
// DÉTECTION DES INTENTIONS
// ==================================================

function detecterIntention(texte) {

    if (
        contient(texte, [
            "heure",
            "horloge",
            "temps",
            "actuelle"
        ])
    ) {
        return "heure";
    }


    if (
        contient(texte, [
            "date",
            "jour",
            "aujourd",
            "quel jour"
        ])
    ) {
        return "date";
    }


    if (
        contient(texte, [
            "qui es tu",
            "qui tu es",
            "tu es qui",
            "presente toi",
            "parle moi de toi"
        ])
    ) {
        return "presentation";
    }


    if (
        contient(texte, [
            "salut",
            "bonjour",
            "hello",
            "hey",
            "coucou"
        ])
    ) {
        return "salutation";
    }


    if (
        contient(texte, [
            "merci",
            "je te remercie"
        ])
    ) {
        return "merci";
    }


    if (
        contient(texte, [
            "aide",
            "aider",
            "aide moi"
        ])
    ) {
        return "aide";
    }


    if (
        contient(texte, [
            "au revoir",
            "a plus",
            "a bientot",
            "bye"
        ])
    ) {
        return "aurevoir";
    }


    return "inconnu";
}


// ==================================================
// ANALYSE DU CONTEXTE
// ==================================================

function analyserContexte(texte) {

    if (
        contient(texte, [
            "math",
            "mathematique",
            "equation",
            "calcul",
            "derivee",
            "integrale",
            "probabilite"
        ])
    ) {

        memoire.sujet = "mathématiques";
        sauvegarder();

    } else if (
        contient(texte, [
            "code",
            "python",
            "javascript",
            "html",
            "css",
            "programmation"
        ])
    ) {

        memoire.sujet = "programmation";
        sauvegarder();

    } else if (
        contient(texte, [
            "tyrone",
            "assistant",
            "ia"
        ])
    ) {

        memoire.sujet = "Tyrone";
        sauvegarder();
    }
}


// ==================================================
// QUESTIONS SUR LE CONTEXTE
// ==================================================

function questionContexte(texte) {

    if (
        contient(texte, [
            "de quoi on parle",
            "de quoi parlons nous",
            "quel est le sujet",
            "on parlait de quoi"
        ])
    ) {

        if (memoire.sujet) {

            return (
                "On parle de " +
                memoire.sujet +
                "."
            );
        }

        return (
            "On n'a pas encore défini " +
            "de sujet précis."
        );
    }


    if (
        contient(texte, [
            "tu te souviens",
            "tu te rappelles"
        ])
    ) {

        if (memoire.prenom) {

            return (
                "Oui. Je me souviens que " +
                "tu t'appelles " +
                memoire.prenom +
                "."
            );
        }

        return (
            "Je me souviens seulement de ce " +
            "que j'ai enregistré pour l'instant."
        );
    }

    return null;
}


// ==================================================
// RÉPONSE DE TYRONE
// ==================================================

function reponseTyrone(message) {

    // Nettoyage et correction
    const texte = corriger(
        normaliser(message)
    );


    // Analyse du contexte
    analyserContexte(texte);


    // Calcul
    const calcul =
        trouverCalcul(texte);

    if (calcul) {
        return calcul;
    }


    // Prénom
    const prenom =
        gererPrenom(texte);

    if (prenom) {
        return prenom;
    }


    // Contexte
    const contexte =
        questionContexte(texte);

    if (contexte) {
        return contexte;
    }


    // Intentions
    switch (
        detecterIntention(texte)
    ) {

        case "heure":
            return obtenirHeure();


        case "date":
            return obtenirDate();


        case "presentation":
            return (
                "Je suis Tyrone, ton assistant " +
                "personnel. Je suis encore en " +
                "développement, mais je vais " +
                "progressivement apprendre à " +
                "faire de plus en plus de choses."
            );


        case "salutation":

            return memoire.prenom
                ? `Salut ${memoire.prenom} !`
                : "Salut !";


        case "merci":
            return "Avec plaisir !";


        case "aide":
            return (
                "Bien sûr. Dis-moi ce que tu " +
                "veux faire et je vais essayer " +
                "de t'aider."
            );


        case "aurevoir":
            return "À plus !";


        default:
            return (
                "Je n'ai pas encore appris à " +
                "comprendre cette demande."
            );
    }
}


// ==================================================
// ENVOI DU MESSAGE
// ==================================================

function envoyerMessage() {

    const texte =
        messageInput.value.trim();

    if (!texte) {
        return;
    }


    // Afficher le message utilisateur
    ajouterMessage(
        texte,
        "utilisateur"
    );


    // Ajouter à l'historique
    historique.push({
        texte: texte,
        auteur: "utilisateur"
    });


    // Générer la réponse
    const reponse =
        reponseTyrone(texte);


    // Petit délai pour donner un effet naturel
    setTimeout(() => {

        ajouterMessage(
            reponse,
            "tyrone"
        );

        historique.push({
            texte: reponse,
            auteur: "tyrone"
        });

        sauvegarder();

    }, 300);


    // Vider la zone de saisie
    messageInput.value = "";
}


// ==================================================
// ÉVÉNEMENTS
// ==================================================

boutonEnvoyer.addEventListener(
    "click",
    envoyerMessage
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            envoyerMessage();
        }

    }
);


// ==================================================
// DÉMARRAGE
// ==================================================

chargerHistorique();
