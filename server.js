import express from "express";

const app = express();

app.use(express.static('rpgmakermv'));

app.listen(3000, () => console.log(`server started on port 3000`));