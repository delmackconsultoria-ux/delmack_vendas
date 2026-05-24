import bcrypt from 'bcryptjs';

const testCases = [
  {
    email: 'odair@baggioimoveis.com.br',
    password: '&FYgkcUWSg1D',
    hash: '$2b$10$26SU/QcQmFgCzteMZ1HQTusXq4VxXcVtWTe6UUwZjcoThD/tCTHTi'
  },
  {
    email: 'darlan@baggioimoveis.com.br',
    password: 'sSTwhw@QlR8&9n',
    hash: '$2b$10$Bu5.WhAIrJNpwz88R.k38umqGAJhwo58XyppoMsNCrT8R/CShj/ti'
  },
  {
    email: 'camila.pires@baggioimoveis.com.br',
    password: 'EHSQY#3&kVJn',
    hash: '$2b$10$6cE7L0adY4j5TpkZ3E69DO6apaIMyykeFPSM7rInBUFLu0aAc.F2q'
  }
];

console.log('=== TESTE 3: Validar hashes com bcrypt ===\n');

for (const test of testCases) {
  const isValid = await bcrypt.compare(test.password, test.hash);
  console.log(`Email: ${test.email}`);
  console.log(`Senha: ${test.password}`);
  console.log(`Hash válido? ${isValid ? '✅ SIM' : '❌ NÃO'}`);
  console.log('---');
}
