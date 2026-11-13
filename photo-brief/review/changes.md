# Photo brief: changes (photo-prompts-fixed.csv)

Every row (all 40) was checked against the current text in `stories/all-stories.json` and the country in `art/scenes-*.json`. 19 rows changed and 21 are byte-identical. The columns, order and quoting are the same as in the original (`csv` QUOTE_MINIMAL, `\n`). The `use` column is unchanged in every row. Rewritten prompts keep the house template: '<culture> setting. Location: … The famous landmark … must be clearly visible …', then 'No people. Keep the lower-left third…' for Hybrid rows or 'Show authentic, diverse people…' for Photo-only rows, followed by the shared style string and 'Landmark to show: …'.

After the fix, the country in every row matches the scene country (b1-06 Mexico, b1-07 Colombia and b1-08 Chile now agree with the patched scenes).

| id | fields changed | why |
|---|---|---|
| a1-04 | prompt | Removed the 'tiny red dog jacket hanging by the door' (Tinto is wearing it in the story) and the leftover strawberries; the window now shows an empty cake stand where the white cake with red strawberries stood. Added the small park with a bench where the cake is found. |
| a1-09 | prompt | The Spanish omelette was already 'ready' on Friday; in the story Marta only plans to cook it on Saturday and has 'un poco' of bread and cheese. Removed the vase of flowers (Javier brings the flowers). |
| a2-01 | prompt, caption | Dropped the indoor tropical garden: it is in the old hall, not by the platforms, and Adif's station remodel announced its removal (the audit asked for its status to be verified; the prompt no longer depends on it). The platform now looks onto the 1892 iron-and-glass hall. Caption rewritten (Atocha opened 1851; the hall dates from 1892). |
| a2-02 | prompt | The box, key, mangoes and sleeping dog were all on one doorstep. In the story the mangoes go to the bakery, the key opens a green door at Hidalgo 12, and the puppy (with a red ribbon) is inside the house. The prompt now shows the green door numbered 12 with the key in the lock and the open blue gift box with its note. |
| a2-03 | landmark, prompt, caption | Machu Picchu (about 1,000 km away) was used as the Lima landmark, shown as a framed photo. Replaced it with the Malecón de Miraflores / Costa Verde cliffs seen from the kitchen window. Added the small jar (the grandmother's secret) and a table set for the Sunday family lunch. Caption rewritten. |
| a2-04 | prompt | 'crowded fans' benches empty' was self-contradictory. The stands are now described as empty for now (the photo has no people), and the scene is set on the sunny Saturday of the final. |
| a2-05 | prompt | The story is a cold winter afternoon (the teaser was already corrected), not evening. The key detail was missing: the door is blue (number 9), and Valentina lives next door at number 7. Removed the stray phone and umbrella props. |
| a2-06 | prompt | The lamp was on the floor. In the story Camila puts it on the table. |
| a2-07 | prompt, caption | Removed the duplicated 'No people.' Antique market stalls became antique shop windows: the San Telmo fair is on Sundays, but Rodrigo plays every afternoon. Caption: San Telmo is 'one of' the oldest barrios (Monserrat has an equal claim). |
| a2-10 | prompt | 'Dark storm clouds gathering' at the festival contradicted the story: it rained the night before, and the festival evening is the happy ending. Now wet cobblestones and a clearing sky in August. |
| b1-06 | country, city, landmark, culture, prompt, caption | Wrong country. The row was Puerto Rico / El Yunque, but the story is set in Oaxaca (the scene is already patched to Mexico). Now Mexico / Oaxaca / Templo de Santo Domingo de Guzmán: an attic storeroom with a trunk and the 1962 photo of the young woman and the thin boy with a guitar. Caption rewritten. |
| b1-07 | country, city, landmark, culture, prompt, caption | Wrong country. The row was Dominican Republic / Santo Domingo, but the story is set in downtown Bogotá (the scene is already patched to Colombia). The cast now matches the story: Camilo trying to switch off the talking shoes, Teresa, two investors in dark suits and older doña Beatriz with her antique pen. Landmark: Torre Colpatria. The audit suggested Monserrate, but a1-04 and b2-04 already use it, and a downtown office tower view fits better. Caption rewritten. |
| b1-08 | country, city, landmark, culture, prompt, caption | Wrong country. The row was Cuba / Havana (guayabera, Capitolio, Malecón), but the story is set in Valparaíso (the scene is already patched to Chile). Now a Valparaíso classroom on a spring (November) morning, with the colored-chalk message, balloons, former students at the back, and the teacher holding the wooden box with the old chalk. Caption rewritten. |
| b1-09 | city, landmark, prompt, caption | Arenal cannot be seen from San José (about 90 km away, behind the cordillera). It is replaced by Irazú, which rises east of San José. The scene moved from the stairwell to the lobby, where the story happens, and now includes Mr. Gutiérrez's pot and gas stove, Gonzalo with his dog and the guitar. Caption rewritten. |
| b2-02 | landmark, prompt, caption | The prompt showed a 'wood-fired clay oven' and a living older Maya woman. The pib is an underground earth oven, and the grandmother has died; the older character is Esperanza's father, who uses a cane. Chichén Itzá (about 120 km away) is not in the story and was removed from the landmark. Caption rewritten (cathedral completed 1598). |
| b2-04 | prompt | 'A cup of tea' became two cups of cold coffee, as in the story. The desk is now in Maribel's tiny La Candelaria apartment. |
| b2-06 | prompt | There was a wall clock stopped at 4:10. In the story it is a silver pocket watch with an engraved lid, kept on a velvet cloth in a desk drawer. Also replaced the vague 'zigzag-crowned' description of the university building. |
| b2-08 | landmark, prompt, caption | 'Three friends of different ages' became four classmates in their early forties (Catalina, Renato, Pía with her twins, and Matías), with Joaquín arriving. It is now set at the hilltop lookout on a March evening with the Ascensor Reina Victoria, which the story names. The caption (Neruda's house) was replaced with one about the Reina Victoria lift. |
| b2-09 | prompt | The prompt showed a gallery of Quito School paintings. Room seven in the story holds domestic objects (irons, inkwells, sewing machine, wedding dress, and the walnut music box in a glass case). The guard is now in his fifties, standing at the door. |

## Value changes (non-prompt fields)

- **a2-01 caption:** Atocha is Madrid's historic train station and contains an indoor tropical garden. → Madrid's first railway station opened at Atocha in 1851, and its great iron-and-glass hall dates from 1892.
- **a2-03 landmark:** Machu Picchu → Malecón de Miraflores and the Costa Verde cliffs
- **a2-03 caption:** Machu Picchu is a 15th-century Inca city high in the Andes and one of the most famous sites in the world. → In Lima's Miraflores district, the Malecón is a chain of clifftop parks along the Costa Verde, high above the Pacific Ocean.
- **a2-07 caption:** San Telmo is Buenos Aires's oldest neighborhood and is known for tango, antiques and its Sunday market. → San Telmo is one of Buenos Aires's oldest neighborhoods and is known for tango, antiques and its Sunday market.
- **b1-06 country:** Puerto Rico → Mexico
- **b1-06 city:** Rural Puerto Rico → Oaxaca
- **b1-06 landmark:** El Yunque → Templo de Santo Domingo de Guzmán
- **b1-06 culture:** Puerto Rican → Mexican (Oaxacan)
- **b1-06 caption:** El Yunque is the only tropical rainforest in the U.S. National Forest System and is in Puerto Rico. → The Templo de Santo Domingo de Guzmán in Oaxaca, built in the 16th and 17th centuries, is famous for its gilded Baroque interior.
- **b1-07 country:** Dominican Republic → Colombia
- **b1-07 city:** Santo Domingo → Bogotá
- **b1-07 landmark:** Cathedral of Santo Domingo → Torre Colpatria
- **b1-07 culture:** Dominican (Santo Domingo) → Colombian (Bogotá)
- **b1-07 caption:** The Zona Colonial of Santo Domingo is a UNESCO World Heritage site and the oldest European settlement in the Americas. → Torre Colpatria, a 196-meter skyscraper finished in 1979, was the tallest building in Colombia for more than three decades.
- **b1-08 country:** Cuba → Chile
- **b1-08 city:** Havana → Valparaíso
- **b1-08 landmark:** El Capitolio and the Malecón → Valparaíso's hillside neighborhoods and bay
- **b1-08 culture:** Cuban → Chilean (Valparaíso)
- **b1-08 caption:** The Malecón is Havana's long seafront promenade where people gather in the evenings. → Valparaíso's historic quarter, with its colorful hillside neighborhoods and old funicular lifts, has been a UNESCO World Heritage site since 2003.
- **b1-09 city:** San José region → San José
- **b1-09 landmark:** Arenal Volcano → Irazú Volcano
- **b1-09 caption:** Costa Rica protects about a quarter of its land in national parks and reserves. → Irazú, at 3,432 meters the highest active volcano in Costa Rica, rises above the Central Valley east of San José.
- **b2-02 landmark:** Mérida Cathedral and Chichén Itzá → Mérida Cathedral
- **b2-02 caption:** Chichén Itzá, near Mérida, was a major Maya city, and its pyramid El Castillo is one of the New Seven Wonders. → Mérida's Cathedral of San Ildefonso, completed in 1598, is one of the oldest cathedrals in the Americas.
- **b2-08 landmark:** Valparaíso funiculars and harbor → Ascensor Reina Victoria and the harbor
- **b2-08 caption:** Poet Pablo Neruda had one of his houses, La Sebastiana, in Valparaíso. → The Ascensor Reina Victoria is one of the historic funicular lifts that still carry passengers up Valparaíso's steep hills.

## Checked and left unchanged

- **a1-03:** the story never names the city, so the Barcelona row does not contradict it. The audit's point (a Catalan-speaking city as the A1 model) is an editorial choice and is left as it is.
- **a1-01, 02, 05–08, 10; a2-08, 09; b1-01–05, 10; b2-01, 03, 05, 07, 10:** these match the story, and their captions were checked as accurate (for example Bellas Artes 1934, San Ginés 1894, El Morro 16th century, Palacio de Cristal 1887, Mercado del Puerto 1868, Arco de Santa Catalina 17th century, Capitolio 1929, and Quito among the first World Heritage sites).

Note: `photo-brief/photo-prompts-paste.txt` and `photo-prompts-copy.html` are older exports (for example, '1. a1-01 Tomás's Breakfast, Puerto Rico'), so regenerate them from the fixed CSV before use.
