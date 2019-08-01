const {getDatabase} = require('./mongo');
const {ObjectID} = require('mongodb');

const collectionName = 'to-dos';

async function insertToDo(toDo) {
  const database = await getDatabase();
  const {insertedId} = await database.collection(collectionName).insertOne(toDo);
  return insertedId;
}

async function getToDos() {
  const database = await getDatabase();
  return await database.collection(collectionName).find({}).toArray();
}

async function deleteToDo(id) {
  const database = await getDatabase();
  await database.collection(collectionName).deleteOne({
    _id: new ObjectID(id),
  });
}

async function updateToDo(id, toDo) {
  const database = await getDatabase();
  delete toDo._id;
  await database.collection(collectionName).update(
    { _id: new ObjectID(id), },
    {
      $set: {
        ...toDo,
      },
    },
  );
}

module.exports = {
  insertToDo,
  getToDos,
  deleteToDo,
  updateToDo,
};
