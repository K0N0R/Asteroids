# Wdrożenie 0.89 — początek gry i panele produkcji

Zmieniono priorytet po zgłoszeniu autora: najpierw działający początek i czytelne podstawy gospodarki, potem dalsze planety.

## Balans startu

Usunięto partię 99 Fe + 1 C → 12 stali. Teraz 4 paczki Fe i 1 dodatku C tworzą 4 paczki stali. Paczka węgla jest umownym dodatkiem technologicznym; proporcje nie udają składu masowego ani wzoru chemicznego stali. Opis wyjaśnia, że stal jest stopem, a nie cząsteczką.

Pierwsze zaplecze: 2 poszycia stalowe I, 1 maszyneria I, 1 elektronika I. Nie wymaga układu zasilania ani wielokrotnego wytwarzania zagnieżdżonych części. Produkcja od zera:

- 1 partia stali, 2 partie oczyszczania miedzi, 2 partie przewodników;
- 1 partia oczyszczania krzemu i 1 krzemionki;
- 2 poszycia, 1 maszyneria, 1 elektronika.

Łącznie 4 Fe, 1 C, 4 Cu, 3 Si, 2 O. Nagrody za pierwsze zadania dodatkowo dostarczają poszycie i żelazo. Powiększono początkowe złoża miedzi/krzemu i dodano drugie złoże z tlenem, aby składniki były dostępne bez resetowania skał. Komplet do produkcji oraz 24 Fe pierwszego zadania zajmuje 34 miejsca w ładowni 40. Zadanie zaplecza i odprawa wskazują części oraz potrzebę zbierania różnych pierwiastków z początkowego złoża.

## Laboratorium i Warsztat

Lewy panel zachowuje wybór przepisu. Środkowy pokazuje niepołączone składniki jednej partii, tabelę pełnych nazw z kolumnami Masz/Potrzeba oraz opis procesu. Prawy pokazuje produkt, aktualny zapas, przyrost i przewidywany stan magazynu.

Przyciski 1/5/10/maks. wybierają liczbę partii, aktualizując tabelę i wynik. Jedna akcja Wytwórz zatwierdza wybór. Braki są zaznaczone w tabeli, bez powtarzania pełnej listy kosztów w komunikacie. Blokady technologii i dostępu nadal obowiązują. Podgląd korzysta z tego samego magazynu co transakcja, także na Księżycu i dla zestawów naprawczych.

Schemat wody używa atomów zebranych pierwiastków: 2 H + O → H₂O. Wynikiem jest jedna woda, a grafika przed pokazuje H, H, O; po pokazuje H₂O. To uproszczone łączenie atomów, nie zapis reakcji wodoru i tlenu gazowego. Tlen: 2 O → O₂. Krzemionka: Si + 2 O → SiO₂, z zaznaczeniem fragmentu większej sieci. Po kolejnej uwadze autora ujednolicono ilustracje: produkt Laboratorium jest identyczny jako składnik Warsztatu, w magazynie i podczas transferu. Oczyszczona miedź i krzem są pojedynczymi ikonami produktu. Usunięto osobny renderer wyników receptur, który wcześniej powodował rozbieżności. Zniknęły dopiski „schemat jednej partii”, nagłówek „PO” i licznik partii. Nagłówek opisów to „Ciekawostka”, a treść dotyczy właściwości i zastosowań materiałów zamiast umowności gry.

## Sprawdzenie

30/30 celowanych testów: chemia, pierwsze zaplecze, dostępne ilości w jednym początkowym sektorze, droga od pierwszej dostawy do zaplecza, zgodność podglądu z transakcją oraz lokalny magazyn Księżyca. Nie uruchamiano pełnej regresji. Kontrola w przeglądarce obejmowała stal, przeliczenie pięciu partii z niedoborem węgla, wodę z rzeczywistą zmianą zapasu i Warsztat. Bez błędów konsoli. Ilustracje i teksty sprawdzono na rzeczywistych komponentach, na danych testowych bez modyfikacji zapisu gracza. Nie przegrywano całej kampanii ręcznie od początku.

Zapis kampanii 57; dziennik 23. Starszy balans jest odrzucany.
