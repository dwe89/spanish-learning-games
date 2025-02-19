export const verbs = {
    present: {
        regular: {
            hablar: {
                yo: 'hablo',
                tú: 'hablas',
                'él/ella': 'habla',
                nosotros: 'hablamos',
                vosotros: 'habláis',
                'ellos/ellas': 'hablan'
            },
            comer: {
                yo: 'como',
                tú: 'comes',
                'él/ella': 'come',
                nosotros: 'comemos',
                vosotros: 'coméis',
                'ellos/ellas': 'comen'
            },
            vivir: {
                yo: 'vivo',
                tú: 'vives',
                'él/ella': 'vive',
                nosotros: 'vivimos',
                vosotros: 'vivís',
                'ellos/ellas': 'viven'
            }
        },
        irregular: {
            ser: {
                yo: 'soy',
                tú: 'eres',
                'él/ella': 'es',
                nosotros: 'somos',
                vosotros: 'sois',
                'ellos/ellas': 'son'
            },
            estar: {
                yo: 'estoy',
                tú: 'estás',
                'él/ella': 'está',
                nosotros: 'estamos',
                vosotros: 'estáis',
                'ellos/ellas': 'están'
            },
            ir: {
                yo: 'voy',
                tú: 'vas',
                'él/ella': 'va',
                nosotros: 'vamos',
                vosotros: 'vais',
                'ellos/ellas': 'van'
            },
            tener: {
                yo: 'tengo',
                tú: 'tienes',
                'él/ella': 'tiene',
                nosotros: 'tenemos',
                vosotros: 'tenéis',
                'ellos/ellas': 'tienen'
            }
        }
    },
    preterite: {
        regular: {
            hablar: {
                yo: 'hablé',
                tú: 'hablaste',
                'él/ella': 'habló',
                nosotros: 'hablamos',
                vosotros: 'hablasteis',
                'ellos/ellas': 'hablaron'
            },
            comer: {
                yo: 'comí',
                tú: 'comiste',
                'él/ella': 'comió',
                nosotros: 'comimos',
                vosotros: 'comisteis',
                'ellos/ellas': 'comieron'
            },
            vivir: {
                yo: 'viví',
                tú: 'viviste',
                'él/ella': 'vivió',
                nosotros: 'vivimos',
                vosotros: 'vivisteis',
                'ellos/ellas': 'vivieron'
            }
        },
        irregular: {
            ser: {
                yo: 'fui',
                tú: 'fuiste',
                'él/ella': 'fue',
                nosotros: 'fuimos',
                vosotros: 'fuisteis',
                'ellos/ellas': 'fueron'
            },
            estar: {
                yo: 'estuve',
                tú: 'estuviste',
                'él/ella': 'estuvo',
                nosotros: 'estuvimos',
                vosotros: 'estuvisteis',
                'ellos/ellas': 'estuvieron'
            },
            ir: {
                yo: 'fui',
                tú: 'fuiste',
                'él/ella': 'fue',
                nosotros: 'fuimos',
                vosotros: 'fuisteis',
                'ellos/ellas': 'fueron'
            },
            tener: {
                yo: 'tuve',
                tú: 'tuviste',
                'él/ella': 'tuvo',
                nosotros: 'tuvimos',
                vosotros: 'tuvisteis',
                'ellos/ellas': 'tuvieron'
            }
        }
    }
};

export const verbLevels = {
    1: ['present.regular'],
    2: ['present.regular', 'present.irregular'],
    3: ['present.regular', 'present.irregular', 'preterite.regular'],
    4: ['present.regular', 'present.irregular', 'preterite.regular', 'preterite.irregular']
};

// Helper function to get available verbs for a level
export function getVerbsForLevel(level) {
    const availableTenses = [];
    for (let i = 1; i <= level; i++) {
        availableTenses.push(...verbLevels[i]);
    }
    return availableTenses;
}
