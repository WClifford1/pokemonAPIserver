const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

app.get("/fetchPokemon", async (req, res) => {
  const result = await fetchPokemonData(req.query.page, req.query.per_page);
  res.json({ data: result });
});



const fetchPokemonData = async (page, per_page) => {
  const firstGenerationPokemonIds = await fetchFirstGenerationPokemonIds();
  const start = (parseInt(page) - 1) * parseInt(per_page);
  const finish = start + parseInt(per_page);
  const paginatedPokemonData = await Promise.all(firstGenerationPokemonIds.slice(start, finish).map(async (name) => {
    return await getPokemonData(name);
  }));
  const serializedPokemonData = serializePokemonData(paginatedPokemonData);
  return { pokemon: serializedPokemonData, total: firstGenerationPokemonIds.length };
};

const fetchFirstGenerationPokemonIds = async () => {
  const fetcher = await fetch('https://pokeapi.co/api/v2/generation/1');
  const data = await fetcher.json();
  const ids = data.pokemon_species.map((pokemon) => {
    const arr = pokemon.url.split('/');
    return arr[arr.length-2];
  });
  return ids.sort((a, b) => { return a - b; });
};

const getPokemonData = async (id) => {
  const fetcher = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  return await fetcher.json();
};

const serializePokemonData = (pokemonData) => {
  return pokemonData.map((pokemon) => {
    const { id, name, types } = pokemon;
    return { id, name, types: getTypes(types), image: pokemon.sprites.front_default };
  })
};

const getTypes = (types) => {
  return types.map((type) => {
    return type.type.name;
  })
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
