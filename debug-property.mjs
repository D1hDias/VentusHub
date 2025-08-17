// Debug específico para o problema de ownership da propriedade ID 2
console.log("🔧 Debug da propriedade ID 2...");

// Simular os dados que devem estar no banco
const userIdFromSession = "1"; // Como string, que vem da sessão
const userIdFromProperty = "1"; // Como deveria estar no banco

console.log("=== OWNERSHIP DEBUG ===");
console.log(`Session userId: "${userIdFromSession}" (type: ${typeof userIdFromSession})`);
console.log(`Property userId: "${userIdFromProperty}" (type: ${typeof userIdFromProperty})`);
console.log(`Comparison result: ${userIdFromProperty !== userIdFromSession}`);
console.log(`Should allow access: ${userIdFromProperty === userIdFromSession}`);

// Testar diferentes cenários
const scenarios = [
  { session: "1", property: "1", name: "Both strings" },
  { session: "1", property: 1, name: "String vs Number" },
  { session: 1, property: "1", name: "Number vs String" },
  { session: 1, property: 1, name: "Both numbers" }
];

console.log("\n=== SCENARIO TESTING ===");
scenarios.forEach(scenario => {
  const match = scenario.property === scenario.session;
  console.log(`${scenario.name}: ${scenario.property} === ${scenario.session} = ${match}`);
});