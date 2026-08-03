// Popula o banco com a barbearia de exemplo: serviços, profissionais,
// expediente, alguns clientes e agendamentos dos próximos dias.
// Rode com: npm run db:seed

import { PrismaClient } from "@prisma/client";
import { hashSenha } from "../src/lib/senha";
import { dataHoraBrasil, hojeISO, somarDias, diaSemanaDe } from "../src/lib/datas";

const prisma = new PrismaClient();

const SERVICOS = [
  {
    nome: "Corte masculino",
    descricao: "Máquina, tesoura e finalização. O clássico bem feito.",
    precoCentavos: 4500,
    duracaoMin: 30,
    destaque: false,
    ordem: 1,
  },
  {
    nome: "Corte + barba",
    descricao: "O combo completo: cabelo, barba na navalha e toalha quente.",
    precoCentavos: 7500,
    duracaoMin: 60,
    destaque: true,
    ordem: 2,
  },
  {
    nome: "Barba na navalha",
    descricao: "Toalha quente, navalha e balm hidratante.",
    precoCentavos: 3500,
    duracaoMin: 30,
    destaque: false,
    ordem: 3,
  },
  {
    nome: "Corte infantil",
    descricao: "Para os pequenos, com toda a paciência do mundo.",
    precoCentavos: 4000,
    duracaoMin: 30,
    destaque: false,
    ordem: 4,
  },
  {
    nome: "Pezinho / acabamento",
    descricao: "Aquele retoque rápido no contorno entre um corte e outro.",
    precoCentavos: 2000,
    duracaoMin: 15,
    destaque: false,
    ordem: 5,
  },
  {
    nome: "Sobrancelha na navalha",
    descricao: "Alinhamento simples e discreto.",
    precoCentavos: 1500,
    duracaoMin: 15,
    destaque: false,
    ordem: 6,
  },
  {
    nome: "Platinado",
    descricao: "Descoloração completa com matização. Reserve a manhã.",
    precoCentavos: 15000,
    duracaoMin: 90,
    destaque: true,
    ordem: 7,
  },
];

const PROFISSIONAIS = [
  {
    nome: "José Carlos",
    apelido: "Zé",
    bio: "Dono da casa. 18 anos de tesoura, especialista em degradê e navalha.",
    ordem: 1,
    // Segunda a sexta, com almoço; sábado direto.
    expediente: [
      { diaSemana: 1, inicio: "09:00", fim: "19:00", pausaInicio: "12:00", pausaFim: "13:30" },
      { diaSemana: 2, inicio: "09:00", fim: "19:00", pausaInicio: "12:00", pausaFim: "13:30" },
      { diaSemana: 3, inicio: "09:00", fim: "19:00", pausaInicio: "12:00", pausaFim: "13:30" },
      { diaSemana: 4, inicio: "09:00", fim: "19:00", pausaInicio: "12:00", pausaFim: "13:30" },
      { diaSemana: 5, inicio: "09:00", fim: "19:00", pausaInicio: "12:00", pausaFim: "13:30" },
      { diaSemana: 6, inicio: "08:00", fim: "17:00", pausaInicio: null, pausaFim: null },
    ],
    servicos: "todos" as const,
  },
  {
    nome: "Rafael Steffen",
    apelido: "Rafa",
    bio: "Rei do fade e do platinado. Atende de terça a sábado.",
    ordem: 2,
    expediente: [
      { diaSemana: 2, inicio: "10:00", fim: "20:00", pausaInicio: "13:00", pausaFim: "14:00" },
      { diaSemana: 3, inicio: "10:00", fim: "20:00", pausaInicio: "13:00", pausaFim: "14:00" },
      { diaSemana: 4, inicio: "10:00", fim: "20:00", pausaInicio: "13:00", pausaFim: "14:00" },
      { diaSemana: 5, inicio: "10:00", fim: "20:00", pausaInicio: "13:00", pausaFim: "14:00" },
      { diaSemana: 6, inicio: "08:00", fim: "17:00", pausaInicio: null, pausaFim: null },
    ],
    servicos: "todos" as const,
  },
  {
    nome: "Bruno Hoffmann",
    apelido: "Bruninho",
    bio: "Corte clássico e barba. Bom papo garantido.",
    ordem: 3,
    expediente: [
      { diaSemana: 1, inicio: "13:00", fim: "20:00", pausaInicio: null, pausaFim: null },
      { diaSemana: 3, inicio: "13:00", fim: "20:00", pausaInicio: null, pausaFim: null },
      { diaSemana: 4, inicio: "13:00", fim: "20:00", pausaInicio: null, pausaFim: null },
      { diaSemana: 5, inicio: "13:00", fim: "20:00", pausaInicio: null, pausaFim: null },
      { diaSemana: 6, inicio: "08:00", fim: "14:00", pausaInicio: null, pausaFim: null },
    ],
    // Bruno não faz platinado.
    servicos: ["Corte masculino", "Corte + barba", "Barba na navalha", "Corte infantil", "Pezinho / acabamento", "Sobrancelha na navalha"],
  },
];

const CLIENTES = [
  { nome: "Marcos Vinícius", telefone: "47988112233" },
  { nome: "Diego Fernandes", telefone: "47991445566" },
  { nome: "Leandro Kruger", telefone: "47996778899" },
  { nome: "Anderson Silva", telefone: "47984332211" },
  { nome: "Paulo Henrique", telefone: "47992556677" },
  { nome: "Tiago Bertoldi", telefone: "47987004455" },
];

async function main() {
  console.log("Semeando a barbearia...");

  // ===== Configuração =====
  const config = {
    nome: "Barbearia do Timbó",
    slogan: "Corte, barba e prosa boa desde 2009",
    telefone: "4733820000",
    whatsapp: "47988887777",
    endereco: "Rua Blumenau, 320 — Centro, Timbó/SC",
    instagram: "barbeariadotimbo",
    mapsUrl: "https://maps.google.com/?q=Rua+Blumenau+320+Timbo+SC",
    passoMin: 15,
    antecedenciaMin: 60,
    diasMax: 21,
    limiteCancelamentoH: 2,
  };
  await prisma.barbearia.upsert({
    where: { id: "config" },
    create: { id: "config", ...config },
    update: config,
  });

  // ===== Serviços =====
  const servicos = new Map<string, { id: string; duracaoMin: number; precoCentavos: number }>();
  for (const s of SERVICOS) {
    const existente = await prisma.servico.findFirst({ where: { nome: s.nome } });
    const salvo = existente
      ? await prisma.servico.update({ where: { id: existente.id }, data: s })
      : await prisma.servico.create({ data: s });
    servicos.set(s.nome, {
      id: salvo.id,
      duracaoMin: salvo.duracaoMin,
      precoCentavos: salvo.precoCentavos,
    });
  }

  // ===== Profissionais, expediente e serviços que cada um faz =====
  const profissionais = new Map<string, string>(); // apelido -> id
  for (const p of PROFISSIONAIS) {
    const existente = await prisma.profissional.findFirst({ where: { nome: p.nome } });
    const dados = { nome: p.nome, apelido: p.apelido, bio: p.bio, ordem: p.ordem, ativo: true };
    const salvo = existente
      ? await prisma.profissional.update({ where: { id: existente.id }, data: dados })
      : await prisma.profissional.create({ data: dados });
    profissionais.set(p.apelido, salvo.id);

    await prisma.horarioTrabalho.deleteMany({ where: { profissionalId: salvo.id } });
    await prisma.horarioTrabalho.createMany({
      data: p.expediente.map((e) => ({ ...e, profissionalId: salvo.id })),
    });

    const nomes = p.servicos === "todos" ? SERVICOS.map((s) => s.nome) : p.servicos;
    await prisma.servicoProfissional.deleteMany({ where: { profissionalId: salvo.id } });
    await prisma.servicoProfissional.createMany({
      data: nomes.map((n) => ({ profissionalId: salvo.id, servicoId: servicos.get(n)!.id })),
    });
  }

  // ===== Login do ADM =====
  const usuario = (process.env.ADMIN_USUARIO || "dono").toLowerCase();
  const senha = process.env.ADMIN_SENHA || "barbearia123";
  await prisma.usuario.upsert({
    where: { usuario },
    create: {
      nome: "José Carlos",
      usuario,
      senhaHash: hashSenha(senha),
      papel: "dono",
      profissionalId: profissionais.get("Zé"),
    },
    update: { papel: "dono", ativo: true },
  });
  // Um barbeiro comum, que só enxerga a própria agenda.
  await prisma.usuario.upsert({
    where: { usuario: "rafa" },
    create: {
      nome: "Rafael Steffen",
      usuario: "rafa",
      senhaHash: hashSenha("rafa123"),
      papel: "barbeiro",
      profissionalId: profissionais.get("Rafa"),
    },
    update: { papel: "barbeiro", ativo: true },
  });

  // ===== Clientes =====
  const clientes = new Map<string, string>();
  for (const c of CLIENTES) {
    const salvo = await prisma.cliente.upsert({
      where: { telefone: c.telefone },
      create: c,
      update: { nome: c.nome },
    });
    clientes.set(c.nome, salvo.id);
  }

  // ===== Agendamentos de exemplo (próximos dias) =====
  // Só cria em dias que o profissional realmente trabalha, para a demonstração
  // nunca nascer com horário fora do expediente.
  await prisma.agendamento.deleteMany({ where: { origem: "demo" } });

  // "dia" aqui é o N-ésimo dia de trabalho DAQUELE profissional a partir de
  // hoje (0 = o próximo dia em que ele atende). Assim a demonstração fica
  // cheia mesmo se hoje for domingo ou feriado.
  const exemplos = [
    { dia: 0, hora: "09:00", prof: "Zé", cliente: "Marcos Vinícius", servico: "Corte + barba" },
    { dia: 0, hora: "10:30", prof: "Zé", cliente: "Diego Fernandes", servico: "Corte masculino" },
    { dia: 0, hora: "14:00", prof: "Zé", cliente: "Leandro Kruger", servico: "Barba na navalha" },
    { dia: 0, hora: "15:30", prof: "Zé", cliente: "Paulo Henrique", servico: "Corte masculino" },
    { dia: 0, hora: "17:00", prof: "Zé", cliente: "Tiago Bertoldi", servico: "Corte + barba" },
    { dia: 0, hora: "14:00", prof: "Bruninho", cliente: "Anderson Silva", servico: "Corte masculino" },
    { dia: 0, hora: "16:00", prof: "Bruninho", cliente: "Diego Fernandes", servico: "Barba na navalha" },
    { dia: 0, hora: "10:00", prof: "Rafa", cliente: "Paulo Henrique", servico: "Platinado" },
    { dia: 0, hora: "15:00", prof: "Rafa", cliente: "Marcos Vinícius", servico: "Corte + barba" },
    { dia: 1, hora: "09:30", prof: "Zé", cliente: "Tiago Bertoldi", servico: "Corte masculino" },
    { dia: 1, hora: "11:00", prof: "Rafa", cliente: "Leandro Kruger", servico: "Corte + barba" },
    { dia: 1, hora: "14:00", prof: "Bruninho", cliente: "Marcos Vinícius", servico: "Corte infantil" },
    { dia: 2, hora: "10:00", prof: "Zé", cliente: "Anderson Silva", servico: "Corte infantil" },
    { dia: 2, hora: "14:30", prof: "Rafa", cliente: "Diego Fernandes", servico: "Barba na navalha" },
  ];

  const expedientePorApelido = new Map(PROFISSIONAIS.map((p) => [p.apelido, p.expediente]));

  // Devolve o N-ésimo dia (a partir de hoje) em que o profissional trabalha.
  function diaDeTrabalho(apelido: string, n: number): string | null {
    const expediente = expedientePorApelido.get(apelido)!;
    let encontrados = 0;
    for (let i = 0; i < 21; i++) {
      const dia = somarDias(hojeISO(), i);
      if (expediente.some((h) => h.diaSemana === diaSemanaDe(dia))) {
        if (encontrados === n) return dia;
        encontrados++;
      }
    }
    return null;
  }

  let criados = 0;
  for (const e of exemplos) {
    const dia = diaDeTrabalho(e.prof, e.dia);
    if (!dia) continue;

    const s = servicos.get(e.servico)!;
    const inicio = dataHoraBrasil(dia, e.hora);
    const fim = new Date(inicio.getTime() + s.duracaoMin * 60000);
    await prisma.agendamento.create({
      data: {
        clienteId: clientes.get(e.cliente)!,
        profissionalId: profissionais.get(e.prof)!,
        servicoId: s.id,
        inicio,
        fim,
        precoCentavos: s.precoCentavos,
        status: "agendado",
        origem: "demo",
      },
    });
    criados++;
  }

  // ===== Histórico dos últimos 45 dias =====
  // Sem histórico os relatórios e a ficha do cliente nascem vazios, e fica
  // difícil mostrar o app funcionando. Usa um sorteio determinístico para o
  // resultado ser sempre o mesmo.
  let semente = 12345;
  const sorteio = () => {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  };

  const servicosDoHistorico = SERVICOS.filter((s) => s.duracaoMin <= 60).map((s) => s.nome);
  const listaClientes = CLIENTES.map((c) => c.nome);
  let historico = 0;

  for (let atras = 45; atras >= 1; atras--) {
    const dia = somarDias(hojeISO(), -atras);
    const semana = diaSemanaDe(dia);

    for (const p of PROFISSIONAIS) {
      const expediente = p.expediente.find((h) => h.diaSemana === semana);
      if (!expediente) continue;

      const abre = Number(expediente.inicio.slice(0, 2)) * 60 + Number(expediente.inicio.slice(3));
      const fecha = Number(expediente.fim.slice(0, 2)) * 60 + Number(expediente.fim.slice(3));
      const pausa = expediente.pausaInicio
        ? {
            de: Number(expediente.pausaInicio.slice(0, 2)) * 60 + Number(expediente.pausaInicio.slice(3)),
            ate: Number(expediente.pausaFim!.slice(0, 2)) * 60 + Number(expediente.pausaFim!.slice(3)),
          }
        : null;

      // Blocos de 90 min: cabe qualquer serviço do histórico sem sobrepor.
      for (let t = abre; t + 90 <= fecha; t += 90) {
        if (pausa && t < pausa.ate && t + 90 > pausa.de) continue;
        if (sorteio() > 0.72) continue; // nem todo bloco foi ocupado

        const nomeServico = servicosDoHistorico[Math.floor(sorteio() * servicosDoHistorico.length)];
        const s = servicos.get(nomeServico)!;
        const nomeCliente = listaClientes[Math.floor(sorteio() * listaClientes.length)];

        const dado = sorteio();
        const status = dado > 0.94 ? "faltou" : dado > 0.89 ? "cancelado" : "concluido";

        const hora = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
        const inicio = dataHoraBrasil(dia, hora);
        await prisma.agendamento.create({
          data: {
            clienteId: clientes.get(nomeCliente)!,
            profissionalId: profissionais.get(p.apelido)!,
            servicoId: s.id,
            inicio,
            fim: new Date(inicio.getTime() + s.duracaoMin * 60000),
            precoCentavos: s.precoCentavos,
            status,
            origem: "demo",
          },
        });
        historico++;
      }
    }
  }

  // Uma folga de exemplo: o Zé sai mais cedo daqui a 3 dias.
  await prisma.bloqueio.deleteMany({ where: { motivo: "Compromisso pessoal (exemplo)" } });
  const diaFolga = somarDias(hojeISO(), 3);
  await prisma.bloqueio.create({
    data: {
      profissionalId: profissionais.get("Zé")!,
      inicio: dataHoraBrasil(diaFolga, "15:00"),
      fim: dataHoraBrasil(diaFolga, "19:00"),
      motivo: "Compromisso pessoal (exemplo)",
    },
  });

  console.log(
    `OK: ${SERVICOS.length} serviços, ${PROFISSIONAIS.length} profissionais, ` +
      `${criados} agendamentos futuros e ${historico} no histórico.`,
  );
  console.log(`Login do ADM: usuário "${usuario}" / senha "${senha}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
