# 0.126 — czyste lądowanie i poruszające się otoczenie

Przy szerokim ujęciu lądowania na Fobosie kamera obejmowała fizyczne współrzędne obiektów należących do innych map. Renderowanie sprawdza teraz również przynależność do bieżącego obszaru. Satuk 15 i jej osłona są widoczne wyłącznie na orbicie Marsa, a grafika ziemskiego Księżyca nie pojawia się w sektorze Marsa. Przenoszony hol zachowuje widoczność podczas transformacji współrzędnych animacji. Ukryto też ogólny dekoracyjny wrak, zastępowany na Marsie właściwymi obiektami fabularnymi.

Podczas wylotu, dokowania i transferów działa stały krok fizyki otoczenia: skały, wraki i inne swobodne ciała dryfują, a istniejące pociski przemieszczają się i wygasają. Animowany statek i hol zachowują zaplanowaną pozycję; ich kolizje są wyłączone do wznowienia zwykłej symulacji. Nie nalicza się obrażeń ani postępu misji i nie uruchamia nowej walki przy zablokowanym sterowaniu. Zlikwidowano również nakładanie animacji wylotu na już trwający transfer przy tworzeniu widoku.

## Weryfikacja

104 testy przechodzą. Obejmują widoczność obiektów podczas szerokiego ujęcia Fobosa, ruch ciał w czasie lądowania, wylotu i dokowania, ochronę statku i holu, ponowne włączenie kolizji oraz istniejące testy Marsa, Księżyca, hipernapędu, grafiki anomalii i zwalniania zasobów. Zapis wyników: `dist/verify126-results.txt`.

Podgląd przeglądarkowy sprawdzono na początku i w trakcie zbliżenia lądowania. Obiekty z obcych map nie pojawiają się poza globem. Kontrola typów, ESLint i build przechodzą.
