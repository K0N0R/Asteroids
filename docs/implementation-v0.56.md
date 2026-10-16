# Implementacja 0.56 — tarcza Satuk 15

Stan: 2026-10-16. Druga część pakietu gospodarki i stacji.

## Działanie

Generator odblokowuje ukończenie ziemskiego zadania **Zaplecze stacji**. Montaż wymaga warsztatu I, mechanika oraz **30 Fe + 6 komponentów konstrukcyjnych + 3 modułów zasilania**. Moduły pochodzą z łańcucha przemysłowego dodanego w 0.55. Generator montuje się raz, po powrocie z wyprawy; odmowa nie zużywa składników.

Dostęp: **Stacja → Przemysł → Tarcza Satuk 15**. Panel pokazuje stan, koszt, warunek blokady i porównanie obszaru ochrony.

Przed montażem chronione jest podejście do doku w promieniu **260 m**. Po montażu ochrona obejmuje **850 m** wokół Satuk 15. Wrogowie i pełne sylwetki asteroid są odpychane poza granicę, a pociski zatrzymywane przez pole. AI respektuje faktyczny promień osłony przy wykrywaniu, wyborze celu i ostrzale. Ta sama ochrona obejmuje holowane wraki i sojuszniczą eskortę w obszarze stacji.

Generator ma stałe zasilanie z instalacji stacji; nie wprowadza osobnego licznika energii, kosztu kolejnego lotu ani paliwa. W tym pakiecie pole jest trwałą osłoną geometryczną, bez punktów wytrzymałości. Instalacja pozostaje po utracie statku.

Osłona towarzyszy Satuk 15 na orbicie w kolejnych sektorach. **Nie chroni placówek, Księżyca ani innych powierzchni**. Usunięto dotychczasowe stosowanie promienia osłony stacji przy początku współrzędnych mapy powierzchniowej. Obrony baz zachowują własne mechaniki i cele.

Granica jest widoczna w świecie, jej promień na radarze, a HUD sygnalizuje lot wewnątrz rozszerzonego bezpiecznego obszaru. Profil testowy i sandbox zachowują pełną dotychczasową osłonę od początku, bez zbędnego zakupu generatora.

## Zapis

Format kampanii **36**, dziennika fabularnego **15**. Stan generatora jest wymaganym polem logicznym. Poprzednie formaty są odrzucane, zgodnie z decyzją autora; brak migracji.

## Weryfikacja

- Pełna regresja **399/399 testów**, bez pominięć; obejmuje też poprawkę dynamicznej listy celów HUD po budowie stacji księżycowej.
- Sześć nowych testów: warunki i atomowe koszty, produkcja modułów podczas wypraw i zachowanie generatora po stracie, walidacja zapisu, zakres orbita/powierzchnia, rzeczywisty pocisk oraz odpychanie fizycznych asteroid i przeciwników.
- Ten sam pocisk z odległości 900 m trafia statek na 600 m bez generatora i zostaje zatrzymany na 850 m po montażu. Test sprawdza uszkodzenie, usunięcie pocisku i efekt kontaktu z tarczą.
- Test produkcyjny przygotowuje warsztat, mechanika, Fe, komponenty oraz Cu; następnie faktycznie produkuje przewodniki i trzy moduły, montuje generator i sprawdza trwałość po stracie statku. Nie zastępuje pełnej sesji od nowej kampanii.
- Typecheck, lint i produkcyjny build przeszły. Po doprecyzowaniu prezentacji pełnej osłony profilu testowego powtórzono sześć testów tarczy, typecheck i lint.
- Przeglądarka 1280×720: droga do panelu, koszty i jednorazowy montaż, ponowne otwarcie gry, normalny start i lot wewnątrz pola. Brak błędów konsoli. Sprawdzenie UI korzystało z przygotowanego bieżącego zapisu z ukończonym zapleczem i gotowymi modułami.

Dowody: [przed montażem](validation-v0.56/before-install.png), [zamontowany generator](validation-v0.56/installed.png), [pole podczas lotu](validation-v0.56/flight.png).

## Kolejny pakiet

Pełniejszy akt I: najpierw interaktywna minigra łączności zastępująca samo przytrzymywanie E, następnie eskorta wydobywcza Muła. Drony strażnicze, nowe role przeciwników, animacje przejść i rozwój pozostałych sektorów pozostają w kolejnych pakietach backlogu.
