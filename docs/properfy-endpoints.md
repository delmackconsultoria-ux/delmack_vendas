# API Properfy - Endpoints de Imóveis

## Endpoint de Listagem
- **URL**: `https://sandbox.properfy.com.br/api/property/property?page=1&size=10`
- **Método**: GET
- **Authorization**: Bearer Token

## Filtros disponíveis (parâmetro filter):
- chrReference
- chrInnerReference
- chrAddressPostalCode
- chrAddressStreet
- chrNotaryId

## Campos importantes do imóvel:
- id: identificador
- chrReference: referência externa (ex: ZXM-705759)
- chrInnerReference: referência interna
- chrType: tipo (APARTMENT, etc)
- dcmSale: valor de venda
- dcmAreaTotal: área total
- chrAddressStreet: rua
- chrAddressNumber: número
- chrAddressCity: cidade
- chrAddressState: estado
- chrAddressDistrict: bairro
- intBedrooms: quartos
- intBathrooms: banheiros
- intGarage: vagas
