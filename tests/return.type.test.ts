import { it } from '@jest/globals';
import { expectType } from 'tsd'
import { pickDeepSchema } from '../src'
import z from "zod/v4";

describe('object', () => {
	it("object", () => {
		type ExpectedType = {
			name: string
		}

		const schema = z.object({
			name: z.string(),
			name2: z.string()
		})

		const schemaPicked = pickDeepSchema(schema, {
			name: true
		})

		type schemaType = z.infer<typeof schemaPicked>

		expectType<ExpectedType>({} as schemaType)
		expectType<schemaType>({} as ExpectedType)
	})

	it("objectNested", () => {
		type ExpectedType = {
			nested: {
				name: string
			}
		}

		const schema = z.object({
			nested: z.object({
				name: z.string(),
				name2: z.string()
			})
		})

		const schemaPicked = pickDeepSchema(schema, {
			nested: {
				name: true
			}
		})

		type schemaType = z.infer<typeof schemaPicked>

		expectType<ExpectedType>({} as schemaType)
		expectType<schemaType>({} as ExpectedType)
	})
})

describe("array", () => { })
describe("nullable", () => { })
describe("optional", () => { })



