import { describe, it, expect } from "vitest";
import { KeywordDetectorService } from "../keyword-detector.service";

describe("KeywordDetectorService", () => {
    const sut = new KeywordDetectorService();

    describe("isConfirmation", () => {
        it("detecta keywords exatas em português", () => {
            expect(sut.isConfirmation("sim")).toBe(true);
            expect(sut.isConfirmation("Confirmado!")).toBe(true);
            expect(sut.isConfirmation("pode confirmar")).toBe(true);
            expect(sut.isConfirmation("ok")).toBe(true);
        });

        it("detecta keywords exatas em inglês", () => {
            expect(sut.isConfirmation("yes")).toBe(true);
            expect(sut.isConfirmation("of course")).toBe(true);
        });

        it("não dispara quando a keyword é substring de outra palavra", () => {
            expect(sut.isConfirmation("simples pergunta sobre o horário")).toBe(false);
            expect(sut.isConfirmation("vou chegar simplesmente atrasado")).toBe(false);
        });
    });

    describe("isCancellation", () => {
        it("detecta keywords exatas em português", () => {
            expect(sut.isCancellation("não")).toBe(true);
            expect(sut.isCancellation("nao vou")).toBe(true);
            expect(sut.isCancellation("preciso cancelar")).toBe(true);
            expect(sut.isCancellation("quero remarcar")).toBe(true);
        });

        it("detecta keywords exatas em inglês", () => {
            expect(sut.isCancellation("no")).toBe(true);
            expect(sut.isCancellation("I need to cancel")).toBe(true);
            expect(sut.isCancellation("can't make it")).toBe(true);
        });

        it("não dispara quando a keyword é substring de outra palavra", () => {
            expect(sut.isCancellation("quero marcar uma nova consulta")).toBe(false);
            expect(sut.isCancellation("do you know the address?")).toBe(false);
            expect(sut.isCancellation("qual o valor da consulta noturna?")).toBe(false);
        });
    });

    describe("isDirectResponse", () => {
        it("retorna true para confirmação ou cancelamento", () => {
            expect(sut.isDirectResponse("sim")).toBe(true);
            expect(sut.isDirectResponse("cancelar")).toBe(true);
        });

        it("retorna false para mensagens neutras", () => {
            expect(sut.isDirectResponse("qual o endereço da clínica?")).toBe(false);
        });
    });
});
