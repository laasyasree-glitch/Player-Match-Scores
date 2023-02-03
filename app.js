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

app.use(express.json());

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name ='${playerName}'
  WHERE
    player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
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
  const result = await db.all(getAllSQLQuery);
  res.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject2(eachPlayer))
  );
});

app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;
  const getAllSQLQuery = `SELECT player_id, player_name FROM player_match_score NATURAL JOIN player_details  where match_id=${matchId}`;
  const result = await db.all(getAllSQLQuery);
  res.send(
    result.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
