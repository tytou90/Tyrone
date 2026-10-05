// =============================
//        TYRONE - JAVASCRIPT
// =============================

console.log("TYRONE JS CHARGE");


// =============================
//        ÉLÉMENTS HTML
// =============================

const messageInput = document.getElementById("message");
const boutonEnvoyer = document.getElementById("envoyer");
const conversation = document.getElementById("conversation");


// =============================
//          MÉMOIRE
// =============================

let memoireSauvegardee =
    localStorage.getItem("tyroneMemoire");

if (memoireSauvegardee) {

    memoireSauvegardee = JSON.parse(memoireSauvegardee);

} else {

    memoireSauvegardee = {
        prenom: null,
        nom: null,
        age: null
    };

}


// =============================
//       HISTORIQUE
// =============================

let historique =
    localStorage.getItem("tyroneHistorique");

if (historique) {

    historique = JSON.parse(historique);

} else {

    historique = [];

}


// =============================
//     SAUVEGARDER MÉMOIRE
// =============================

function sauvegarderMemoire() {

    localStorage.setItem(
        "tyroneMemoire",
        JSON.stringify(memoireSauvegardee)
    );

}


// =============================
//     SAUVEGARDER HISTORIQUE
// =============================

function sauvegarderHistorique() {

    localStorage.setItem(
        "tyroneHistorique",
        JSON.stringify(historique)
    );

}


// =============================
//      CHARGER HISTORIQUE
// =============================

function chargerHistorique() {

    for (let i = 0; i < historique.length; i++) {

        ajouterMessage(
            historique[i].texte,
            historique[i].type,
            false
        );

    }

}


// =============================
//        ÉVÉNEMENTS
// =============================

boutonEnvoyer.addEventListener(
    "click",
    envoyerMessage
);

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            envoyerMessage();

        }

    }
);


// =============================
//        ENVOYER MESSAGE
// =============================

function envoyerMessage() {

    const texte = messageInput.value.trim();

    if (texte === "") {
        return;
    }

    ajouterMessage(
        texte,
        "utilisateur",
        true
    );

    messageInput.value = "";

    reponseTyrone(texte);
}


// =============================
//        AJOUTER MESSAGE
// =============================

function ajouterMessage(
    texte,
    type,
    sauvegarder = true
) {

    const message = document.createElement("div");

    message.classList.add(
        "message",
        type
    );

    if (type === "utilisateur") {

        message.innerHTML = `
            <strong>Toi :</strong>
            <p>${texte}</p>
        `;

    } else {

        message.innerHTML = `
            <strong>Tyrone :</strong>
            <p>${texte}</p>
        `;

    }

    conversation.appendChild(message);

    if (sauvegarder) {

        historique.push({
            texte: texte,
            type: type
        });

        sauvegarderHistorique();

    }

    conversation.scrollTop =
        conversation.scrollHeight;
}


// =============================
//     DISTANCE ENTRE LES MOTS
// =============================

function distanceMots(a, b) {

    const matrice = [];

    for (let i = 0; i <= a.length; i++) {
        matrice[i] = [i];
    }

    for (let j = 0; j <= b.length; j++) {
        matrice[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {

        for (let j = 1; j <= b.length; j++) {

            if (a[i - 1] === b[j - 1]) {

                matrice[i][j] =
                    matrice[i - 1][j - 1];

            } else {

                matrice[i][j] =
                    Math.min(
                        matrice[i - 1][j] + 1,
                        matrice[i][j - 1] + 1,
                        matrice[i - 1][j - 1] + 1
                    );

            }

        }

    }

    return matrice[a.length][b.length];

}


// =============================
//       CORRECTION DES FAUTES
// =============================

function corrigerTexte(texte) {

    let resultat = texte.toLowerCase();

    resultat = resultat
        .replace(/['’]/g, " ")
        .replace(/[!?.,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const motsConnus = [
        "salut",
        "bonjour",
        "hello",
        "hey",
        "merci",
        "beaucoup",
        "comment",
        "ca",
        "ça",
        "va",
        "vas",
        "qui",
        "es",
        "tu",
        "presente",
        "présente",
        "toi",
        "je",
        "appelle",
        "mapelle",
        "mon",
        "ma",
        "prenom",
        "prénom",
        "nom",
        "quel",
        "quelle",
        "est",
        "aide",
        "moi",
        "au",
        "revoir",
        "plus",
        "bien",
        "tres",
        "très"
    ];

    let mots = resultat.split(" ");

    mots = mots.map(function(mot) {

        if (mot.length <= 3) {
            return mot;
        }

        let meilleurMot = mot;
        let meilleureDistance = Infinity;

        for (let i = 0; i < motsConnus.length; i++) {

            const motConnu = motsConnus[i];

            if (motConnu.length <= 3) {
                continue;
            }

            const distance =
                distanceMots(mot, motConnu);

            if (distance < meilleureDistance) {

                meilleureDistance = distance;
                meilleurMot = motConnu;

            }

        }

        const limite =
            mot.length >= 6 ? 2 : 1;

        if (meilleureDistance <= limite) {
            return meilleurMot;
        }

        return mot;

    });

    return mots.join(" ");

}


// =============================
//       NORMALISER LE TEXTE
// =============================

function normaliserTexte(texte) {

    return texte
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[!?.,;:'’]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


// =============================
//       EXTRAIRE UN PRÉNOM
// =============================

function trouverPrenom(texte) {

    const texteNormalise =
        normaliserTexte(texte);

    let correspondance;


    // Je m'appelle Tytouane
    correspondance =
        texteNormalise.match(
            /\bje\s+m\s*appelle\s+([a-zà-ÿ-]+)/
        );

    if (correspondance) {
        return correspondance[1];
    }


    // Je mapelle Tytouane
    correspondance =
        texteNormalise.match(
            /\bje\s+mapelle\s+([a-zà-ÿ-]+)/
        );

    if (correspondance) {
        return correspondance[1];
    }


    // Mon prénom est Tytouane
    correspondance =
        texteNormalise.match(
            /\bmon\s+prenom\s+est\s+([a-zà-ÿ-]+)/
        );

    if (correspondance) {
        return correspondance[1];
    }


    return null;

}


// =============================
//       RÉPONSE DE TYRONE
// =============================

function reponseTyrone(message) {

    const texteCorrige =
        corrigerTexte(message);

    const texte =
        normaliserTexte(texteCorrige);


    console.log("Message reçu :", message);
    console.log("Texte corrigé :", texteCorrige);
    console.log("Texte analysé :", texte);


    let reponse;


    // =============================
    //       MÉMORISER LE PRÉNOM
    // =============================

    const prenom =
        trouverPrenom(message);


    if (prenom) {

        memoireSauvegardee.prenom =
            prenom;

        sauvegarderMemoire();

        reponse =
            "Enchanté " +
            prenom +
            " ! 😎 Je vais m'en souvenir.";

    }


    // =============================
    //       DEMANDER LE PRÉNOM
    // =============================

    else if (
        texte.includes("comment je m appelle") ||
        texte.includes("quel est mon prenom") ||
        texte.includes("quel est mon nom")
    ) {

        if (memoireSauvegardee.prenom) {

            reponse =
                "Tu t'appelles " +
                memoireSauvegardee.prenom +
                " 😎";

        } else {

            reponse =
                "Tu ne m'as pas encore donné ton prénom.";

        }

    }


    // =============================
    //           SALUT
    // =============================

    else if (
        texte.includes("salut") ||
        texte.includes("bonjour") ||
        texte.includes("hello") ||
        texte.includes("hey")
    ) {

        const reponses = [
            "Salut 👋",
            "Hey ! 👋",
            "Bonjour ! 😎",
            "Salut, ça fait plaisir de te voir !"
        ];

        reponse =
            reponses[
                Math.floor(
                    Math.random() * reponses.length
                )
            ];

    }


    // =============================
    //        COMMENT ÇA VA
    // =============================

    else if (
        texte.includes("ca va") ||
        texte.includes("comment tu vas") ||
        texte.includes("comment vas tu")
    ) {

        reponse =
            "Je vais très bien 😎 Et toi ?";

    }


    // =============================
    //          QUI ES-TU
    // =============================

    else if (
        texte.includes("qui es tu") ||
        texte.includes("qui tu es") ||
        texte.includes("presente toi")
    ) {

        reponse =
            "Je suis Tyrone 🤖, ton assistant personnel. " +
            "Je suis encore en développement, mais on va progressivement me rendre beaucoup plus intelligent.";

    }


    // =============================
    //            MERCI
    // =============================

    else if (
        texte.includes("merci")
    ) {

        reponse =
            "Avec plaisir ! 😎";

    }


    // =============================
    //             AIDE
    // =============================

    else if (
        texte.includes("aide")
    ) {

        reponse =
            "Bien sûr ! Dis-moi ce dont tu as besoin.";

    }


    // =============================
    //          AU REVOIR
    // =============================

    else if (
        texte.includes("au revoir") ||
        texte.includes("a plus")
    ) {

        reponse =
            "À plus 👋";

    }


    // =============================
    //        QUESTION INCONNUE
    // =============================

    else if (
        texte.includes("?") ||
        texte.startsWith("pourquoi") ||
        texte.startsWith("comment") ||
        texte.startsWith("quel") ||
        texte.startsWith("quelle") ||
        texte.startsWith("qu est ce que") ||
        texte.startsWith("est ce que")
    ) {

        reponse =
            "Bonne question 🤔 Je ne sais pas encore répondre à ce type de question.";

    }


    // =============================
    //        RÉPONSE PAR DÉFAUT
    // =============================

    else {

        reponse =
            "Je t'ai compris, mais je ne sais pas encore quoi répondre à ça 🤖";

    }


    // =============================
    //       AFFICHER RÉPONSE
    // =============================

    setTimeout(function() {

        ajouterMessage(
            reponse,
            "tyrone",
            true
        );

    }, 500);

}


// =============================
//       LANCEMENT DE TYRONE
// =============================

chargerHistorique();