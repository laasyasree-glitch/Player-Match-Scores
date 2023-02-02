const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => console.log("Local Server started at Port 3004"));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeServerAndDB();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (req, res) => {
  const getAllSQLQuery = `SELECT PLAYER_ID, PLAYER_NAME FROM player_details order by player_id`;
  const result = await db.all(getAllSQLQuery);
  res.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;
  const getAllSQLQuery = `SELECT PLAYER_ID, PLAYER_NAME FROM player_details where player_id=${playerId}`;
  const result = await db.get(getAllSQLQuery);
  res.send(convertDbObjectToResponseObject(result));
});

app.put("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;
  console.log(playerId);
  const { playerName } = req.body;
  const getAllSQLQuery = `
  UPDATE player_details  
  SET PLAYER_NAME='${playerName}'
  where player_id=${playerId}`;
  await db.run(getAllSQLQuery);
  res.send("Player Details Updated");
});

app.get("/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const getAllSQLQuery = `SELECT * FROM match_details where match_id=${matchId}`;
  const result = await db.get(getAllSQLQuery);
  res.send(convertDbObjectToResponseObject2(result));
});

app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;
  const getAllSQLQuery = `SELECT match_id,match,year FROM player_match_score NATURAL JOIN match_details  where player_id=${playerId}`;
  const result = await db.get(getAllSQLQuery);
  res.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  });
});

app.get("/MATCHES/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const getAllSQLQuery = `SELECT player_id, player_name FROM player_match_score NATURAL JOIN player_details  where match_id=${matchId}`;
  const result = await db.get(getAllSQLQuery);
  //   res.send({
  //     playerId: result.player_id,
  //     playerName: result.player_name,
  //   });
  res.send(result);
});

module.exports = app;
