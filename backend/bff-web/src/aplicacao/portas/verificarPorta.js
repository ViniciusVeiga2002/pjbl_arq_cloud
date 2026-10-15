// Verificação, em tempo de execução, de que um adaptador injetado expõe os
// métodos que um caso de uso exige (JavaScript não tem "interface" nativa).
// Cada caso de uso pede só os métodos que usa (Interface Segregation).
function verificarPorta(adaptador, nomeDaPorta, metodosExigidos) {
  for (const metodo of metodosExigidos) {
    if (typeof adaptador?.[metodo] !== 'function') {
      throw new TypeError(`Adaptador não implementa a ${nomeDaPorta} (método "${metodo}" ausente).`);
    }
  }
  return adaptador;
}

module.exports = verificarPorta;
