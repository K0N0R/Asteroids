# Wdrożenie 0.98 — paczka wyposażenia stacji księżycowej

Zadanie Wyposażenie stacji ma dwie fazy. W pierwszej pokazuje rzeczywisty stan magazynu Satuk 15 dla 8 poszyć stalowych I, 4 maszynerii I, 3 elektronik I, 2 układów zasilania I i 2 systemów podtrzymywania życia I. Stwórz zachowuje nawigację do receptur i powrót. Po przygotowaniu paczki karta przechodzi do transportu; samo pakowanie nie kończy zadania.

Przycisk Zabierz ładunek na stację księżycową atomowo pobiera komplet części i rozpoczyna lot. Tworzy jedną fizyczną paletę, automatycznie przypiętą do aktualnego statku; nie zajmuje ładowni. Ma własny model i nazwę nawigacyjną. Nie podlega recyklingowi Satuk 15, limitowi zwykłych wraków ani zniszczeniu przez obrażenia. Zwykły wylot bez paczki pozostaje dostępny.

Kampania przechowuje identyfikator i położenie palety, z informacją o powierzchni. Strata statku, odwrót, dokowanie lub odświeżenie nie usuwa obiektu i nie zwraca ani ponownie nie pobiera części. Kolejny statek może podjąć go przez istniejące H/J. Śluzy oraz wejście/wyjście z powierzchni przenoszą go razem ze statkiem i zachowują położenie w zapisie.

Zetknięcie palety z obszarem placówki księżycowej przyjmuje ją automatycznie, także po zwolnieniu holu. Dopiero wtedy wewnętrzne moduły i zadanie stają się ukończone; w tym samym locie pojawia się Muł oraz jego pole wydobycia. Usunięto możliwość zastąpienia paczki transferem pojedynczych części. Dalsza dostawa Fe i C, miejscowa produkcja, odbiór techniczny i atak pozostają w istniejącym cyklu.

Weryfikacja: 8 nowych sprawdzeń atomowego pakowania, automatycznego holu, odmowy transferu części, trwałości po śmierci i zapisie, kontaktu z placówką i Muła, hiperskoku, lądowania oraz pełnej puli wraków. Dodatkowo przeszły celowane sprawdzenia budowy, nawigacji, lokalnego przemysłu i przejść Księżyca (łącznie 41). Uaktualniono wcześniejsze testy częściowych dostaw do nowej paczki, a testy dalszego frachtu do pełnego pozostałego manifestu. W przeglądarce sprawdzono obie fazy, start przyciskiem z paczką i automatyczną dostawę. Bez pełnej regresji.

Rejestracja parsera @pixi/sound jest w punkcie startowym przeglądarki zamiast w module SoundManager używanym także przez narzędzia bez DOM. Odtwarzanie w grze pozostaje podłączone.

Wersja aplikacji 0.98.0, kampanii 65, dziennika 29. Starsze zapisy odrzucane bez migracji zgodnie z polityką projektu.
