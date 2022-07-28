import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name) private readonly pokemonModel: Model<Pokemon>,
  ) { }


  async create(createPokemonDto: CreatePokemonDto) {

    try {
      createPokemonDto.name = createPokemonDto.name.toLowerCase();
      const newPokemon = await this.pokemonModel.create(createPokemonDto);
      return newPokemon;
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  findAll() {
    return this.pokemonModel.find();
  }

  async findOne(term: string) {
    let pokemon: Pokemon;

    // no
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // mongoid
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() });
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with term ${term} not found`);
    }

    return pokemon;
  }


  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    let pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto);
      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);
    //await pokemon.deleteOne();
    //return {id};
    // const result = await this.pokemonModel.findByIdAndDelete(id);
    const result = await this.pokemonModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new BadRequestException(`Pokemon id ${id} not found`);
    }
    return;
  }

  private handleExceptions(error: any) {

    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exist in DB ${JSON.stringify(error.keyValue)}`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }

}
