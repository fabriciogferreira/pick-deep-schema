import * as z from "zod/v4";
import { ZodObject, ZodArray } from "zod/v4";
import type { ZodType } from "zod/v4";
import type { $ZodLooseShape } from "zod/v4/core";

type UnwrapNullable<T extends ZodType> =
  T extends z.ZodNullable<infer U> ? U : T;

export type PropertiesToPick<T extends ZodType> =
  UnwrapNullable<T> extends ZodObject< //UnwrapNullable when object().nullable()
    // Usa infer dentro do conditional type para extrair o shape
    infer Shape extends Record<string, ZodType>
    // Esse ramo só existe se TODAS as propriedades forem ZodObject
  >
    //para um objeto passado diretamente
    ? {
        // Para cada propriedade definida (CADA PROPRIEDADE É OPCIONAL) do shape, permite:
        // - Se for objeto
        //    - true → pega tudo profundamente
        //    - recursão → pick profundo
        // - se não for objeto
        //    - true
        [K in keyof Shape]?: UnwrapNullable<Shape[K]> extends ZodObject // Se a propriedade for ZodObject | //UnwrapNullable when object(object().nullable())
          ? true | PropertiesToPick<Shape[K]>  // Permite recursão|true só se for ZodObject
          : UnwrapNullable<Shape[K]> extends ZodArray<infer Element extends ZodType> // Se for array | //UnwrapNullable when array object(object().array().nullable())
            ? UnwrapNullable<Element> extends ZodObject // E se o elemento for objeto | //UnwrapNullable when object(object().nullable().array().nullable())
              ? true | PropertiesToPick<Element> // Permite recursão|true só se for ZodObject
              : true // Senão, só permite true
            : true; // Se não for objeto nem array, só permite true
      }
    //para um array passado diretamente
    : T extends ZodArray<
        // Se for array, extrai o tipo interno
        infer Element extends ZodObject
        // Só permite recursão se o elemento for objeto
      >
      ? PropertiesToPick<Element>
      : never; // Impede usos inválidos e força erro de TS


type PickObjectShape<
  ZO extends ZodObject,
  PTP extends PropertiesToPick<ZO>
> = {
  // Para cada chave ZOKey em Shape do ZO que também está em PTP, retorne ZOKey, senão retorne never
  [ZOKey in keyof ZO["shape"] as ZOKey extends keyof PTP ? ZOKey : never]:
    //Se o valor da chave é true
    PTP[ZOKey] extends true
      //Significa que não é um objeto, logo eu retorno o valor
      ? ZO["shape"][ZOKey]
      //Senão, verifico se a chave exitente no ZO é um ZodObject
      : ZO["shape"][ZOKey] extends ZodObject
        // Se for um ZodObject, precisamos garantir que o objeto passado
        // pelo usuário (PTP[ZOKey]) é válido para esse sub-schema.
        //Isso impede que o usuário tente pegar propriedades que não existem.
        ? PTP[ZOKey] extends PropertiesToPick<ZO["shape"][ZOKey]>
          // Chamamos PickObjectShape novamente, agora passando o ZodObject interno e o objeto de seleção interno
          ? ZodObject<PickObjectShape<ZO["shape"][ZOKey], PTP[ZOKey]>>
          //Se a propriedade é inválida, retornar never para forçar erro de tipo
          : never
        //Senão retorno never
        : never
};

//TODO: propertiesToPick DEVE aceitar apenas 'true' ou 'objeto', qualquer outra coisa deve gerar erro de TS, até mesmo 'undefined', se você não quiser pegar a propriedade, não a coloque no objeto propertiesToPick

export function pickDeepSchema<
  S extends ZodObject, 
  P extends PropertiesToPick<S>, 
>(
  schema: S,
  propertiesToPick: P
){
  const newShape: $ZodLooseShape = {};

  Object.entries(schema.shape).forEach(([key, value]) => {
    if (key in propertiesToPick) {
      const propertyToPick = propertiesToPick[key];

      if (propertyToPick === undefined) return

      if (value instanceof ZodObject) {
        newShape[key] = propertyToPick === true
          ? value
          : pickDeepSchema(value, propertyToPick);
        
        return;
      }

      if (value instanceof ZodArray) {
        if (propertyToPick === true) {
          newShape[key] = value;
          return;
        }

        const element = value.element;

        if (element instanceof ZodObject) {
          newShape[key] = z.array(
            pickDeepSchema(
              element,
              propertyToPick
            )
          );
          return;
        }
      }
      newShape[key] = schema.shape[key];
    }
  })

  return z.object(newShape) as ZodObject<PickObjectShape<S, P>> ;
}
