```javascript
const messageInput = document.getElementById("message");
const boutonEnvoyer = document.getElementById("envoyer");
const conversation = document.getElementById("conversation");

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

function sauvegarder() {
    localStorage.setItem("tyroneMemoire", JSON.stringify(memoire));
    localStorage.setItem("tyroneHistorique", JSON.stringify(historique));
}

function ajouterMessage(texte, auteur) {
    const message = document.createElement("div");

    message.className = `message ${auteur}`;
    message.textContent = texte;

    conversation.appendChild(message);
    conversation.scrollTop = conversation.scrollHeight;
}

function chargerHistorique() {
    historique.forEach(message => {
        ajouterMessage(message.texte, message.auteur);
    });
}

function normaliser(texte) {
    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[?!.,;:'"]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

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

const motsConnus = [
    "heure", "horloge", "temps", "actuelle",
    "date", "jour", "aujourd", "aujourdhui",
    "salut", "bonjour", "hello", "hey", "coucou",
    "merci", "aide", "aider",
    "aurevoir", "plus", "bientot", "bye",
    "qui", "es", "tu", "presente", "toi",
    "parle", "moi", "connait", "connais",
    "dire", "donne", "quelle", "est",
    "peux", "peut", "mon", "prenom",
    "comment", "appelle"
];

function corriger(texte) {
    return texte.split(" ").map(mot => {

        let meilleur = mot;
        let meilleureDistance = Infinity;

        motsConnus.forEach(connu => {
            const d = distance(mot, connu);

            if (d < meilleureDistance) {
                meilleureDistance = d;
                meilleur = connu;
            }
        });

        return meilleureDistance <= 2 ? meilleur : mot;

    }).join(" ");
}

function contient(texte, mots) {
    return mots.some(mot => texte.includes(mot));
}

function gererPrenom(texte) {

    const match = texte.match(
        /je m appelle ([a-zA-ZÀ-ÿ-]+)/
    );

    if (match) {
        memoire.prenom = match[1];
        sauvegarder();

        return `D'accord, je retiens que tu t'appelles ${memoire.prenom}.`;
    }

    if (
        texte.includes("comment je m appelle") ||
        texte.includes("quel est mon prenom") ||
        texte.includes("tu connais mon prenom")
    ) {
        return memoire.prenom
            ? `Tu t'appelles ${memoire.prenom}.`
            : "Je ne connais pas encore ton prénom.";
    }

    return null;
}

function calculer(expression) {

    expression = expression
        .replace(/plus/g, "+")
        .replace(/moins/g, "-")
        .replace(/fois/g, "*")
        .replace(/multiplie par/g, "*")
        .replace(/divise par/g, "/");

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

    if (!match) return null;

    const resultat = calculer(match[1]);

    return resultat === null
        ? null
        : `Le résultat est ${resultat}.`;
}

function obtenirHeure() {
    return "Il est " +
        new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        }) + ".";
}

function obtenirDate() {
    return "Nous sommes le " +
        new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }) + ".";
}

function detecterIntention(texte) {

    if (contient(texte, [
        "heure", "horloge", "temps", "actuelle"
    ])) return "heure";

    if (contient(texte, [
        "date", "jour", "aujourd", "quel jour"
    ])) return "date";

    if (contient(texte, [
        "qui es tu",
        "qui tu es",
        "tu es qui",
        "presente toi",
        "parle moi de toi"
    ])) return "presentation";

    if (contient(texte, [
        "salut", "bonjour", "hello", "hey", "coucou"
    ])) return "salutation";

    if (contient(texte, [
        "merci", "je te remercie"
    ])) return "merci";

    if (contient(texte, [
        "aide", "aider", "aide moi"
    ])) return "aide";

    if (contient(texte, [
        "au revoir", "a plus", "a bientot", "bye"
    ])) return "aurevoir";

    return "inconnu";
}

function analyserContexte(texte) {

    if (contient(texte, [
        "math",
        "mathematique",
        "equation",
        "calcul",
        "derivee",
        "integrale",
        "probabilite"
    ])) {
        memoire.sujet = "mathématiques";
        sauvegarder();

    } else if (contient(texte, [
        "code",
        "python",
        "javascript",
        "html",
        "css",
        "programmation"
    ])) {
        memoire.sujet = "programmation";
        sauvegarder();

    } else if (contient(texte, [
        "tyrone",
        "assistant",
        "ia"
    ])) {
        memoire.sujet = "Tyrone";
        sauvegarder();
    }
}

function questionContexte(texte) {

    if (contient(texte, [
        "de quoi on parle",
        "de quoi parlons nous",
        "quel est le sujet",
        "on parlait de quoi"
    ])) {

        return memoire.sujet
            ? `On parle de ${memoire.sujet}.`
            : "On n'a pas encore défini de sujet précis.";
    }

    if (contient(texte, [
        "tu te souviens",
        "tu te rappelles"
    ])) {

        return memoire.prenom
            ? `Oui. Je me souviens que tu t'appelles ${memoire.prenom}.`
            : "Je me souviens seulement de ce que j'ai enregistré pour l'instant.";
    }

    return null;
}

function reponseTyrone(message) {

    const texte = corriger(normaliser(message));

    analyserContexte(texte);

    const calcul = trouverCalcul(texte);

    if (calcul) return calcul;

    const prenom = gererPrenom(texte);

    if (prenom) return prenom;

    const contexte = questionContexte(texte);

    if (contexte) return contexte;

    switch (detecterIntention(texte)) {

        case "heure":
            return obtenirHeure();

        case "date":
            return obtenirDate();

        case "presentation":
            return "Je suis Tyrone, ton assistant personnel. Je suis encore en développement, mais je vais progressivement apprendre à faire de plus en plus de choses.";

        case "salutation":
            return memoire.prenom
                ? `Salut ${memoire.prenom} !`
                : "Salut !";

        case "merci":
            return "Avec plaisir !";

        case "aide":
            return "Bien sûr. Dis-moi ce que tu veux faire et je vais essayer de t'aider.";

        case "aurevoir":
            return "À plus !";

        default:
            return "Je n'ai pas encore appris à comprendre cette demande.";
    }
}

function envoyerMessage() {

    const texte = messageInput.value.trim();

    if (!texte) return;

    ajouterMessage(texte, "utilisateur");

    historique.push({
        texte: texte,
        auteur: "utilisateur"
    });

    const reponse = reponseTyrone(texte);

    setTimeout(() => {

        ajouterMessage(reponse, "tyrone");

        historique.push({
            texte: reponse,
            auteur: "tyrone"
        });

        sauvegarder();

    }, 300);

    messageInput.value = "";
}

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

chargerHistorique();
```
