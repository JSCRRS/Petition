const { getSignatures, createSignature } = require("./signatures");

createSignature({
    firstname: "Blubb",
    lastname: "Blabb",
    signature: "someSIGNATURRREEE",
}).then(() => {
    console.log("saved!");
});

/*getSignatures().then((signatures) => {
    console.log(signatures);
});*/
