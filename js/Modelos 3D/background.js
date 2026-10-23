import { createRio } from './rio.js';
import { createCidade } from './cidade.js';
import { createNatureza } from './natureza.js';

export function createBackground(scene) {
    // 1. Cria a calha do rio e o shader animado de água
    createRio(scene);

    // 2. Cria a cidade ao fundo (ruas, prédios, ponte, carros, iluminação noturna)
    createCidade(scene);

    // 3. Cria toda a parte orgânica em volta da ETA (grama tileável, árvores, pedras, etc)
    // OBS: Deve ser chamado após o "ground" principal já ter sido instanciado pela scene
    createNatureza(scene);
}