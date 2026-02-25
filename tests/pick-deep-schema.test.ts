import { expect, it } from '@jest/globals';
import { pickDeepSchema } from '../src'
import z from "zod/v4";

//
// object
// optional
// nullable
// array
// nested

// object
// schema

// object > schema = schema
// object < schema = erro
// object !== schema = erro
// object === schema = Schema

it('root, object > schema = schema', () => {
	const expectedObject = {
		name: 'joão',
	}

	const objectToParse = {
		name: 'joão',
		phone: 123123,
	}

	const schema = z.object({
		name: z.string().length(4),
		phone: z.number()
	})

	const schemaPicked = pickDeepSchema(schema, {
		name: true
	})

	const returnedObject = schemaPicked.parse(objectToParse)

	expect(expectedObject).toEqual(returnedObject)
})

it('root, object < schema = error', () => {
	const objectToParse = {
		name: 'joão',
	}

	const schema = z.object({
		name: z.string().length(4),
		phone: z.number()
	})

	const schemaPicked = pickDeepSchema(schema, {
		name: true,
		phone: true
	})

	expect(() => {
		schemaPicked.parse(objectToParse)
	}).toThrow()
})

it('root, object !== schema = error', () => {
	const objectToParse = {
		name: 'joão',
	}

	const schema = z.object({
		name: z.number(),
	})

	const schemaPicked = pickDeepSchema(schema, {
		name: true,
	})

	expect(() => {
		schemaPicked.parse(objectToParse)
	}).toThrow()
})

it('root, object === schema = schema', () => {
	const expectedObject = {
		name: 'joão',
	}

	const objectToParse = {
		name: 'joão',
	}

	const schema = z.object({
		name: z.string().length(4),
	})

	const schemaPicked = pickDeepSchema(schema, {
		name: true
	})

	const returnedObject = schemaPicked.parse(objectToParse)

	expect(expectedObject).toEqual(returnedObject)
})
