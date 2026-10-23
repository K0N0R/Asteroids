# 0.129 — poprawki radaru i śluz

## Radar

Przy pustym widoku anomalii wywołanie `Graphics.fill()` ponownie wypełniało poprzedni kształt, czyli okrąg radaru. To dawało fałszywe skażenie przy powiększaniu Fobosa i w całym obszarze asteroidy. Nakładka rozpoczyna ścieżkę dopiero po znalezieniu pierwszej skażonej komórki i jest wypełniana tylko wtedy, gdy takie komórki istnieją. Pusty wynik nie zmienia instrukcji tła. Wspólna funkcja rysująca ma testy na rzeczywistym obiekcie Pixi Graphics.

## Trasy śluz i zewnętrzna granica

Obie trasy, Mars–Fobos i Fobos–asteroida, mają pas wolny od anomalii o promieniu 650 jednostek. Odjęto go od wspólnego pola przed utworzeniem wielokątów, więc jest czysty w mechanice, grafice i radarze. Pas obejmuje śluzy, podejścia oraz przestrzeń pomiędzy obszarami. Dotychczasowa odporność na obrażenia podczas hipernapędu pozostaje; widoczna trasa sama jest teraz wolna od zagrożenia.

Zastąpiono przycinanie anomalii do grywalnego koła osobną, nieregularną obwiednią wychodzącą poza mapę. Pole i geometria obejmują większe otoczenie map orbitalnych. Granica sektora nadal wyznacza grę, ale nie ucina włókien. Po wycięciu pasa transportowego przesunięto zachodnią strefę Fobosa, żeby zachować około 25% pokrycia grywalnej orbity; Mars nadal ma około 75%, a asteroida 0%.

## Kierunek przelotu

W ostatniej klatce wygładzonej podróży pozycja mogła już równać się celowi wskutek zaokrąglenia. Liczenie obrotu z przyrostu pozycji dawało wtedy `atan2(0, 0)` i ustawienie kadłuba w kierunku zera. Kierunek jest teraz liczony ze stałych końców trasy, także w ostatniej klatce i po odzyskaniu sterowania.

## Weryfikacja

132 testy zakresu zmian przechodzą (`dist/verify129-results.txt`). Nowe przypadki obejmują brak modyfikacji tła przez pustą nakładkę, wszystkie skale przy asteroidzie, powiększenie bezpiecznej części Fobosa, wolne trasy z bocznym zapasem, brak wielokątów na trasach, zasięg poza mapą i niezerową różnorodność obwiedni. Test symulacji wymusza zerowe końcowe przesunięcie we wszystkich czterech kierunkach podróży, sprawdza obrót przy wyjściu oraz po kolejnych klatkach.

Podgląd przeglądarkowy potwierdza czysty radar przy Fobosie ×4 i asteroidzie ×0.75, częściowe pokrycie orbity Fobosa oraz wolne miejsce przy śluzie po podróży. Dla wszystkich sześciu skal obszaru asteroidy liczba skażonych komórek wynosi zero (`dist/radar129-checks.json`).

Kontrola typów, ESLint i build release przechodzą. Wyniki: `dist/typecheck129-results.txt`, `dist/lint129-results.txt`, `dist/build129-results.txt`.
