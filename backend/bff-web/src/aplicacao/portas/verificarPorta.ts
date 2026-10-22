// Verificação, em tempo de execução, de que um adaptador injetado expõe os
// métodos que um caso de uso exige. O TypeScript já checa isso na compilação;
// esta verificação protege a execução contra adaptadores montados sem tipos.
// Cada caso de uso pede só os métodos que usa (Interface Segregation).
function verificarPorta<T extends object>(adaptador: T, nomeDaPorta: string, metodosExigidos: readonly string[]): T {
  for (const metodo of metodosExigidos) {
    if (typeof (adaptador as Record<string, unknown> | undefined)?.[metodo] !== 'function') {
      throw new TypeError(`Adaptador não implementa a ${nomeDaPorta} (método "${metodo}" ausente).`);
    }
  }
  return adaptador;
}

export default verificarPorta;
