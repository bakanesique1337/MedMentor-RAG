package ru.medmentor.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RagMarkdownChunkingServiceTest {

    private RagMarkdownChunkingService service;

    @BeforeEach
    void setUp() {
        service = new RagMarkdownChunkingService();
    }

    @Test
    void emitsOneChunkPerSurvivingSectionWithHeadingPrefix() {
        final String input = """
                # Оглавление
                Оглавление .......... 2
                Список сокращений ... 4

                # Список сокращений
                ВИЧ — вирус.
                VZV — varicella zoster virus.

                # 1. Краткая информация
                ## 1.2 Этиология и патогенез
                Возбудитель — VZV. Иммуносупрессия увеличивает риск в 20 раз.

                ## 1.6 Клиническая картина
                Везикулёзные высыпания в зоне одного дерматома.
                """;

        final List<String> chunks = service.chunkMarkdown(input, 1800, 300, 200);

        assertEquals(2, chunks.size(), "Оглавление и Список сокращений должны быть выкинуты");
        assertTrue(chunks.get(0).startsWith("Раздел: 1. Краткая информация / 1.2 Этиология и патогенес")
                        || chunks.get(0).startsWith("Раздел: 1. Краткая информация / 1.2 Этиология и патогенез"),
                "Первая выжившая секция — этиология; заголовочный путь должен присутствовать. Получили:\n" + chunks.get(0));
        assertTrue(chunks.get(0).contains("Иммуносупрессия увеличивает риск"));
        assertTrue(chunks.get(1).startsWith("Раздел: 1. Краткая информация / 1.6 Клиническая картина"),
                "Вторая секция — клиническая картина. Получили:\n" + chunks.get(1));
    }

    @Test
    void dropsCommonDescribingSections() {
        final String input = """
                # Термины и определения
                Опоясывающий герпес — вирусное заболевание.

                # 1.4 Особенности кодирования по МКБ
                B02.0, B02.1, B02.9.

                # Список литературы
                1. Smith J. ...
                2. Иванов А. ...

                # Приложение А1. Состав рабочей группы
                Иванов И. И., Петров П. П.

                # 2. Диагностика
                Диагноз ставится клинически.
                """;

        final List<String> chunks = service.chunkMarkdown(input, 1800, 300, 200);

        assertEquals(1, chunks.size(), "Должна выжить только секция Диагностика");
        assertTrue(chunks.get(0).contains("Диагноз ставится клинически"));
        assertFalse(chunks.get(0).contains("Опоясывающий герпес — вирусное заболевание"));
        assertFalse(chunks.get(0).contains("B02"));
        assertFalse(chunks.get(0).contains("Smith J"));
        assertFalse(chunks.get(0).contains("Иванов И. И."));
    }

    @Test
    void stripsHeadingDecorationAndPageNumberArtifacts() {
        final String input = """
                # <u>1.6 Клиническая картина</u>
                Основные проявления.

                5

                Боль является основным симптомом.

                7
                """;

        final List<String> chunks = service.chunkMarkdown(input, 1800, 300, 200);

        assertEquals(1, chunks.size());
        final String chunk = chunks.get(0);
        assertTrue(chunk.startsWith("Раздел: 1.6 Клиническая картина"),
                "Декорация <u> должна быть снята. Получили:\n" + chunk);
        assertFalse(chunk.matches("(?s).*\\n5\\n.*"), "Артефакты-номера страниц должны быть вычищены");
        assertFalse(chunk.matches("(?s).*\\n7\\n.*"));
        assertTrue(chunk.contains("Боль является основным симптомом"));
    }

    @Test
    void splitsLargeSectionByParagraphsWithOverlap() {
        final String paragraphA = "А".repeat(700);
        final String paragraphB = "Б".repeat(700);
        final String paragraphC = "В".repeat(700);
        final String input = "# 1.6 Клиническая картина\n" + paragraphA + "\n\n" + paragraphB + "\n\n" + paragraphC;

        final List<String> chunks = service.chunkMarkdown(input, 1000, 150, 200);

        assertTrue(chunks.size() >= 2, "Секция длиннее бюджета — должна быть нарезана");
        for (final String chunk : chunks) {
            assertTrue(chunk.startsWith("Раздел: 1.6 Клиническая картина"),
                    "Все подчанки несут одинаковый заголовочный путь");
        }
        final String secondChunk = chunks.get(1);
        assertTrue(secondChunk.contains("А") || secondChunk.contains("Б"),
                "Второй чанк должен подхватить хвост предыдущего благодаря overlap");
    }

    @Test
    void preservesParentHeadingPathForSubsections() {
        final String input = """
                # 2. Диагностика
                Введение раздела.

                ### 2.3 Лабораторные диагностические исследования
                Молекулярно-биологические методы ПЦР.
                """;

        final List<String> chunks = service.chunkMarkdown(input, 1800, 300, 200);

        assertEquals(2, chunks.size());
        assertTrue(chunks.get(1).startsWith("Раздел: 2. Диагностика / 2.3 Лабораторные диагностические исследования"),
                "Сабсекция должна нести полный путь от родителя. Получили:\n" + chunks.get(1));
    }
}
