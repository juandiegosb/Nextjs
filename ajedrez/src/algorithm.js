const KNIGHT_MOVES = [
  [2, 1], [1, 2], [-1, 2], [-2, 1],
  [-2, -1], [-1, -2], [1, -2], [2, -1]
];

function inBounds(pos) {
  const [r, c] = pos;
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function euclidean(a, b) {
  // A= a[0]-b[0]
  // B= a[1]-b[1]
  // Basicamente sqrt(A^2 + B^2)
  // Calcula la distancia euclidiana entre dos puntos, es decir la linea mas corta
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function knightHeuristic(a, b) {
  // A partir de la distancia euclidiana calculada dividimos sobre el vector de movimiento de un caballo
  // El vector de movimiento del caballo es sqrt(2^2 + 1^2) = sqrt(5)
  // Con esto estimamos el minimo de saltos
  return Math.ceil(euclidean(a, b) / Math.sqrt(5));
}

// Convierte notacion de tablero a coordenadas en un array
function algebraicToCoord(s) {
  const ss = s.toLowerCase().trim();
  if (!/^[a-h][1-8]$/.test(ss)) {
    throw new Error(`Notación inválida: ${s}`);
  }
  const col = ss.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(ss[1], 10) - 1;
  return [row, col];
}

// Convierte coordenadas a notacion de tablero
function coordToAlgebraic(pos) {
  return String.fromCharCode('a'.charCodeAt(0) + pos[1]) + (pos[0] + 1);
}

// Convierte las coordenadas de tablero de los peones a coordenadas normales de array
function parseObstacles(algebraicList) {
  const set = new Set();
  for (const s of (algebraicList || [])) {
    set.add(coordKey(algebraicToCoord(s)));
  }
  return set;
}

// Convierte una coordenada en un string "a,b"
function coordKey([r, c]) {
  return `${r},${c}`;
}

// Convierte un par de valores en coordenadas de un array
function keyToCoord(key) {
  const [r, c] = key.split(',').map(Number);
  return [r, c];
}

// Cola de prioridad, se usa pa conseguir el nodo que tenga menor costo
class MinHeap {
  constructor(compare) {
    this.data = [];
    this.compare = compare; 
  }
  push(item) {
    this.data.push(item);
    this._siftUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._siftDown(0);
    }
    return top;
  }
  _siftUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i], this.data[p])) {
        [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
        i = p;
      } else break;
    }
  }
  _siftDown(i) {
    const n = this.data.length;
    while (true) {
      let l = 2 * i + 1;
      let r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.compare(this.data[l], this.data[smallest])) smallest = l;
      if (r < n && this.compare(this.data[r], this.data[smallest])) smallest = r;
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else break;
    }
  }
  isEmpty() {
    return this.data.length === 0;
  }
}

// Nodo del arbol
class Node {
  constructor(pos, g = 0, h = 0, parentKey = null) {
    this.pos = pos;     
    this.g = g;
    this.h = h;
    this.f = g + h;
  }
}

// Funcion para encontrar camino a un valor en especifico
function reconstructPath(cameFrom, currentKey) {
  const path = [];
  let cur = currentKey;
  while (cur) {
    path.push(keyToCoord(cur));
    cur = cameFrom.get(cur);
  }
  path.reverse();
  return path;
}

// Funcion que encuentra el camino mas corto para el caballo
// startAlg -> Posicion en coordenadas de tablero donde comienza el caballo ("a8", "b2")
// goalAlg -> Posicion en coordenadas de tablero donde debe llegar el caballo ("a8", "b2")
// pawnList -> Lista de coordenadas de posiciones de tablero, donde se encuentran peones que bloquean el camino del caballo (["a8", "b2", "c3"])
function aStarKnight(startAlg, goalAlg, pawnList = []) {
  const start = algebraicToCoord(startAlg);
  const goal = algebraicToCoord(goalAlg);
  const blocked = parseObstacles(pawnList);

  const startKey = coordKey(start);
  const goalKey = coordKey(goal);
  
  // Si las coordenadas no estan dentro del tablero
  if (!inBounds(start) || !inBounds(goal)) {
    throw new Error("start/goal deben estar dentro de 0..7");
  }

  // Si un peon esta en donde se comienza el camino, o donde termina pues erro
  if (blocked.has(startKey) || blocked.has(goalKey)) {
    return null; 
  }

  // Funcion encargada de comparar costos para saber cual es la mayor prioridad.
  // True -> A tiene prioridad
  // False -> B tiene prioridad
  const cmp = (a, b) => {
    if (a.f === b.f) return a.h < b.h;
    return a.f < b.f;
  };

  // Como MinHeap es una cola de prioridad, pues necesita saber cual tiene prioridad
  const openHeap = new MinHeap(cmp);
  // Guarda en tiempo real en un mapa como [posicion inicio, posicion final], esto es para poder reconstruir el camino final
  // Es decir va guardando las mejores maneras de llegar a las posiciones
  // Luego con reconstructPath recorremos el arbol para conseguir cual fue la serie de pasos para llegar alli
  const cameFrom = new Map(); 
  // Lleva la cuenta de pasos hasta cada coordenada especifica
  const gScore = new Map();

  // Aqui guardamos las posiciones, empieza en startKey, y es su movimiento numero 0
  gScore.set(startKey, 0);
  // Con KnightHeuristic conseguimos un valor actual de que tan cerca estamos de nuestro casilla proposito
  const h0 = knightHeuristic(start, goal);
  // Posicion, numero de movimientos, distancia, nodo padre
  openHeap.push(new Node(start, 0, h0, null));
  
  //Set encargado de cerrar nodos cuando no se encuentra un mejor camino
  const closed = new Set();
  
  while (!openHeap.isEmpty()) {
    const currentNode = openHeap.pop();
    // Trae el par de valores de coordenadas [a,b]
    const current = currentNode.pos;
    // Lo convertimos a un string "a,b"
    const currentKey = coordKey(current);
  
    // Se compara si ya llegamos al resultado esperado
    if (currentKey === goalKey) {
      const pathCoords = reconstructPath(cameFrom, currentKey);
      return pathCoords.map(coordToAlgebraic);
    }
    // Si la coordenada que estamos explorando ya fue explorada, pues simplemente evitamos volverlo a explorar
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);

    //Probamos los movimientos y segun la heuristica se elige la mejor variacion
    for (const dm of KNIGHT_MOVES) {
      // Posicion en la que quedaria el caballo
      const neighbor = [current[0] + dm[0], current[1] + dm[1]];
      // Verificamos que no salga del tablero
      if (!inBounds(neighbor)) continue;
      // La volvemos el estring "a,b"
      const nKey = coordKey(neighbor);
      // Si hay un peon en la posicion o si ya esta explorada la posicion, pues la omitimos
      if (blocked.has(nKey) || closed.has(nKey)) continue;

      // Aumentamos el numero de movimientos en esta variante
      const tentativeG = gScore.get(currentKey) + 1;
      // Aca basicamente es un if que detecta si este camino tiene menos movimientos que el mejor que calculamos hasta el momento ejecuta
      // ?? infinity es para cuando no tenemos ningun gScore aun asignado, pues entonces que se tome como infinito
      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        // Va guardando el mejor algoritmo
        cameFrom.set(nKey, currentKey);
        // Actualiza el mejor movimiento hasta el momento
        gScore.set(nKey, tentativeG);
        // Calculamos la distancia que falta para llegar al objetivo
        const h = knightHeuristic(neighbor, goal);
        // Lo ponemos en el arbol con el valor de la distancia actual que falta
        openHeap.push(new Node(neighbor, tentativeG, h, currentKey));
      }
    }
  }

  return null; 
}

// Retorna un array de la lista de movimientos que se deben hacer en coordenadas algebraicas del tablero, por ejemplo ["a1", "b3","c5"], incluye la casilla de inicio y la casilla final
// Si es null es porque no hay camino

export { aStarKnight };
