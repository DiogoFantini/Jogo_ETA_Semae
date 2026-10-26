import { createRio } from './rio.js';
import { createCidade } from './cidade.js';
import { createNatureza } from './natureza.js';

export function createBackground(scene, ground) {
        createRio(scene);
        createCidade(scene);
        createNatureza(scene, ground);
    }