# Korekta oprawy i laserów jednostek AI — 0.78

- Tło gwiazd zachowuje przesunięcie paralaksy od pozycji statku, ale nie otrzymuje już obrotu kamery. Glob i mgławice pozostają nieruchomymi ilustracjami tła podczas skręcania. Obrót świata misji i radaru działa nadal niezależnie.
- Usunięte dodane w 0.77 płyty pod zdrowiem, statusem, hipernapędem, celami i dolnym sterowaniem HUD. Pozostaje cień samych liter.
- Instruktor w ziemskim Prospectorze rzeczywiście wydobywa podczas celu wydobywczego: dolatuje do skały w rejonie szkoleniowym, obraca statek, emituje wiązkę z mocowania lasera, uszkadza i rozbija skałę. Pracuje z połową bazowej mocy lasera; zostawia fizyczny urobek graczowi. Nie zasila automatycznie ładowni ani postępu zadania. Dostawa, utrata kontaktu, zniszczenie lub zmiana celu przerywają wydobycie.
- Muł na Księżycu zachowuje realny cykl wydobycia, zbiórki, napraw i wielokrotnych dostaw. Zamiast pojedynczej wiązki ze środka ma dwie wiązki z mocowań własnych laserów. Poprawiono również skalę jego modelu w eskorcie, zgodnie z wielkością kadłuba. Obie wiązki to wizualizacja dotychczasowej łącznej mocy, bez podwojenia obrażeń.
- Zaokrąglone panele i osobne zaokrąglone ogniwa przekaźnika orbitalnego oraz panele Keplera. Asteroidy mają wygładzone wierzchołki. Wspólne płyty kadłubów mają łagodniejsze narożniki.
- Usunięte dekoracyjne obrysy wypełnionych elementów statków, wyposażenia i instalacji. Prospector zachowuje rosnące fizyczne poszycie jako wypełnioną warstwę. Karty i przyciski nie mają ramek; wybór karty wskazuje miętowy znacznik. Funkcyjne oznaczenia radaru, osłon i wiązek pozostają czytelne.

Format kampanii 47 i dziennika 21 bez zmian.

Weryfikacja obejmuje test rzeczywistego uszkadzania i rozbijania skały przez instruktora, kontrolę dwóch laserów podczas pełnego cyklu księżycowego Muła, regresję kampanii oraz podgląd HUD i porównanie tła przed skrętem i po skręcie. Przygotowany profil przeglądarkowy używa osobnych kluczy zapisu.

Wynik: 515/515 testów, typecheck, ESLint i build produkcyjny poprawne. Podgląd przeglądarkowy bez błędów konsoli.
