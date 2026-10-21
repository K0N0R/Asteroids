# 0.117 — obszary anomalii

Obecne skażone pasma misji odzyskania sondy przy Jowiszu mają nową grafikę wektorową: ciepłe włókna, nierówne połączone komórki, rozświetlone węzły i drobne chłodne punkty. Referencją jest lewa górna część obrazu przekazanego przez autora.

`anomalyCloudView(polygons, seed)` tworzy jedną statyczną, deterministyczną teksturę całego obszaru w Canvas 2D, wyświetlaną przez Pixi. Wspólna siatka z kluczami wierzchołków rysuje każdą krawędź raz. Maska oparta na odległości od obszarów łagodnie wygasza włókna przy granicach, bez obrysów i oddzielnych warstw pasm. Delikatna poświata wychodzi najwyżej 24 jednostki poza geometrię skażenia; nie zmienia jego zasięgu. Tekstura jest zwalniana przy zniszczeniu widoku. Nie ma przebudowy grafiki w każdej klatce ani dodatkowej pętli animacji. Oznaczenia bezpiecznej trasy pozostają nad ilustracją. Geometria skażenia, obrażenia i przebieg misji pozostają dotychczasowe. Format kampanii 66 i dziennika 29 bez zmian.

Przyszłe przekopywanie obszarów po uzyskaniu technologii jest zapisane w aktualnym planie. Ten pakiet nie implementuje niszczenia, odblokowania technologii ani zapisu wyciętych korytarzy.

Weryfikacja: typecheck, ESLint i build poprawne; wizualny podgląd całości i detalu zapisano w `dist/anomalie-117.png`. Dwa testy granic i naliczania obrażeń przechodzą. Cztery testy integracyjne w `anomaly-recovery.test.ts` kończą się na `parseCampaign(JSON.stringify(c))` podczas przygotowania kampanii, przed sprawdzeniem misji. Pakiet nie zmienia kodu zapisu ani symulacji.

Poprawka 0.117.1: dwa testy regresji potwierdzają brak podwajania jasności przy powieleniu obszaru i ciągłe wygaszenie przy granicy. Typecheck, ESLint i build przechodzą. Podgląd: `dist/anomalie-117-poprawka.png`.
