# 0.65: mieszane role przeciwników

Drugi pakiet uzgodnionej rozbudowy walki. Nie zwiększa jeszcze fal obronnych ani nie rozstrzyga fabuły aktu I.

## Jednostki

| Rola           | Kadłub | Prędkość pościgu | Działanie                                                                                          |
| -------------- | ------ | ---------------- | -------------------------------------------------------------------------------------------------- |
| Przechwytujący | 42     | 360              | Wyprzedza ruch celu, szybko podchodzi i strzela słabszymi seriami.                                 |
| Pancernik      | 210    | 140              | Powoli naciska z bliska; po sekundzie ładowania strzela wachlarzem trzech pocisków po 14 obrażeń.  |
| Serwisant      | 62     | 200              | Naprawia jednego rannego sojusznika w walce: 5 HP/s do 420 m, podchodzi do celu w promieniu 800 m. |
| Stawiacz min   | 74     | 190              | Co 5 s walki próbuje zostawić minę za kadłubem; przemieszcza się poprzecznie do celu.              |

Serwisant nie leczy siebie ani bossów. Wymaga widoczności, nie przekracza maksymalnego kadłuba i podczas napraw nie strzela. Zakłócenie broni zatrzymuje naprawy oraz stawianie min. Wyeliminowanie wsparcia pozwala najpierw przełamać naprawiany oddział; sam ostrzał najbliższego celu może nie wystarczyć.

## Miny

- Uzbrojenie trwa 1,5 s; mina pozostaje przez najwyżej 24 s, również po zniszczeniu właściciela.
- Wykrywa przyjazne cele do 95 m i wybucha raz: 24 obrażenia w promieniu 170 m. Obrażenia przechodzą najpierw przez tarczę statku.
- Skały i ściany blokują wykrycie oraz obrażenia. Tarcza stacji usuwa miny w swoim obszarze i blokuje wybuch przez chroniony rejon.
- Maksymalnie cztery miny jednej jednostki i 20 łącznie; brak stawiania wewnątrz przeszkód i innych min.
- Mina ma 12 HP. Ostrzał, laser, wybuch gracza, szczęki Harpuna i ostrza Widma rozbrajają ją bez wrogiego wybuchu, łupu ani dodatkowego zabójstwa.
- Powierzchnia/orbita nie przenoszą min pomiędzy obszarami. Pauza i zakończenie symulacji zatrzymują ich działanie.

## Dostęp i czytelność

Stocznia marsjańska cyklicznie produkuje przechwytującego, Serwisanta, Lancera, Pancernika, stawiacza min i patrol. Zachowuje limit czterech żywych jednostek, pierwszy start po 6 s oraz kolejne co 14 s. Wyłączenie stoczni zatrzymuje produkcję, nie usuwa już wystawionych jednostek ani min.

**Sandbox / testy → Oddział mieszany** wystawia od razu cztery nowe role na pustym poligonie. Cel wymaga czterech zabójstw oraz rzeczywistego powrotu. Zwykła próba dwóch patroli pozostaje niezmieniona; nowy poligon nie zapisuje wyników do kampanii.

Każda rola ma inną sylwetkę. Serwisant pokazuje wiązkę i pierścień napraw, Pancernik trzy linie nadchodzącej salwy. Miny pokazują postęp uzbrojenia i obszar wykrycia, a pobliskie także znak na radarze. Nie dodano wskaźników kierunku nadejścia.

Wraki nadal korzystają z dwóch istniejących kategorii: Pancernik i Lancer ciężkiej, pozostałe lekkiej. Nie dodano nowych kadłubów gracza ani schematu zapisu. Kampania 41 i dziennik 19 pozostają zgodne z 0.64; nie wprowadzono migracji.

## Weryfikacja

Pełna regresja: **439/439 testów**, `npm run typecheck`, `npm run lint`, `npm run build` oraz `git diff --check` zakończone poprawnie. Edytor nie zgłasza błędów w nowych mechanikach ani testach.

Testy ról obejmują naprawy, tłumienie broni, limity i uzbrajanie min, obrażenia oraz bezpieczne rozbrajanie rzeczywistym uzbrojeniem, osłonę przez ściany, salwę, wyprzedzanie ruchu, sylwetki, poligon i skład produkcji. Istniejący test misji stoczni używa nadal bazowego Prospectora: priorytet Serwisanta, rzeczywista walka, zniszczenie rdzenia, powrót i trwały raport. Nie obniżono obrażeń ani wymagań tej misji.

Przeglądarka: rzeczywisty ruch nowych jednostek, naprawa Pancernika, postawienie i uzbrojenie miny oraz inspekcja trzech linii zapowiedzi salwy. Sprawdzono obraz WebGL i zrzuty menu oraz walki przy 1024×768. Przy płótnie 390×844 wszystkie 69 napisów menu pozostaje w granicach, obraz jest niepusty; zachowano dotychczasowe skalowanie całego interfejsu, nie dodawano sterowania dotykowego. Siedem scenariuszy mieści się w dwóch rzędach. Próba została zamknięta do konfiguracji sandboxa, bez zmiany zwykłej kampanii.

Pełne ciągłe przejście kampanii od nowego zapisu i ostateczny balans pozostają osobnym, ostatnim pakietem. Następne są większe mieszane obrony baz.
