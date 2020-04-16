/*
 * Draws an image four times and applies colours gradients on it
 *
 * This is an example source file that works in duktape-webgl bootstrap program and HTML5&WebGL2 compatible browser at the same time
 */

var gl = undefined;

var vao = undefined;
var vertexShader = undefined;
var fragmentShader = undefined;
var program = undefined;
var vbo = undefined;
var indexBuffer = undefined;
var vboIndices = undefined;
var texture = undefined;

var img = {
    // 24bit RGB raw image data, vertically flipped
    "data": "kJCQj4+PdXV1bm5uaGhoaWlpenp6jIyMhISEenp6kJCQbm5uk5OTpqamm5ubpqamqKioioqKWFhYoKCgenp6hoaGubm5pKSkhoaGlpaWgICAqampkpKSeXl5b29vnp6elpaWhoaGgICAm5ubnp6egoKCqqqqnJycgICAl5eXsbGxi4uLjY2Ne3t7iYmJlpaWpKSko6OjnJycp6enlpaWbm5umpqasLCwqKiod3d3fHx8ZWVlenp6kpKSoKCgn5+fnJycm5ubkJCQfHx8XFxcX19fdHR0g4ODkZGRmZmZgICAdHR0n5+fnJycqampm5ubiYmJk5OThISEkpKSg4ODrKyslJSUiYmJm5ubmZmZk5OTmZmZoqKihYWFlJSUhISEi4uLf39/mZmZioqKrq6uq6urra2tp6enpqamlpaWmpqalpaWe3t7goKCkJCQsrKyra2tqqqqiIiIY2Njg4ODlJSUc3NzioqKnp6eg4ODZGRklJSUi4uLiIiIi4uLdnZ2cnJyhISEkZGRiIiIe3t7goKCiYmJioqKiYmJkpKSkpKSo6OjoaGhjIyMjY2Nn5+fo6OjkpKSl5eXn5+fl5eXkJCQhoaGlpaWkpKSlpaWkpKSkJCQeXl5kJCQpqaml5eXdnZ2hISEi4uLpqamnp6epqamn5+frKysnJycjY2Ntra2rq6uiYmJiYmJo6OjoqKioqKiiYmJoaGhd3d3bGxsfHx8l5eXdXV1d3d3i4uLkJCQiIiIpKSkhYWFe3t7kJCQcnJydXV1fX19kJCQk5OTlJSUeXl5i4uLl5eXi4uLiYmJoqKinp6emJiYjIyMpKSko6OjmJiYqKiogICAiIiImpqaoaGhlJSUnJyckpKSl5eXj4+PiYmJg4ODoaGhi4uLmJiYenp6fX19m5ublJSUk5OToKCgioqKlpaWm5ubp6ent7e3qampfHx8cHBwfHx8oaGhrq6uhYWFioqKj4+Pg4ODZmZmhYWFioqKlpaWgICAgICAZGRkiIiIl5eXfHx8enp6gICAgoKCkpKSkpKSjY2NjY2NfX19f39/goKCgoKClpaWm5ubqKiooaGhf39/lpaWhISEnp6etLS0ioqKjIyMoaGho6OjioqKmpqanJycj4+Pqqqql5eXd3d3kJCQnp6el5eXe3t7o6OjjY2NoKCgnJycgICAdnZ2kpKSrKysoqKijY2Nm5ubjY2NoKCgoaGheXl5iIiIjY2NkJCQioqKiYmJlpaWiIiIenp6c3NzeXl5dnZ2iIiIrq6uo6OjhYWFl5eXbGxsfHx8qqqqlpaWkpKSi4uLdXV1cnJycHBwmpqam5ubkpKSn5+fl5eXfX19qampnp6erKysmpqaioqKi4uLl5eXjIyMe3t7iYmJoqKirKyslpaWlpaWeXl5hISEmZmZnp6ecHBwk5OTnp6ei4uLjIyMra2tjIyMoaGhqampoqKij4+PqamptbW1lJSUhISEhYWFfX19jIyMo6Ojnp6ehYWFXFxchISEhoaGenp6kpKSj4+Pm5ubk5OTiIiIlpaWl5eXjY2NmpqaoaGhiIiIl5eXfX19fX19hYWFhoaGgoKCgoKCiYmJkpKSl5eXqKioo6OjiIiInp6esbGxn5+fhYWFj4+PfHx8m5ublJSUeXl5vLy8qamplpaWkZGRjY2No6Ojd3d3g4ODsLCwoqKirq6upKSkbm5ucHBwdnZ2tbW1lpaWtra2tra2oaGhoqKienp6g4ODk5OThYWFiIiIlpaWi4uLgICAhYWFgICAiIiIpqamjIyMl5eXnJycioqKjIyMrKysnJycfHx8f39/i4uLpqamk5OTm5ubbGxsgoKCg4ODiIiIk5OTrKysqamptra2qampjIyMjY2NmpqanJychYWFe3t7b29vmZmZqKiooKCgkJCQkZGRo6OjlJSUi4uLl5eXnJycgoKCl5eXmJiYlpaWioqKiYmJkZGRi4uLo6Ojqampubm5o6OjjY2Nl5eXgoKCj4+PgICAdXV1l5eXmZmZi4uLcHBwg4ODkJCQmZmZmpqan5+fhYWFmZmZnJyclJSUi4uLlJSUe3t7mJiYdHR0j4+PfX19ioqKg4ODgoKCoqKil5eXoaGhra2tpqamj4+PpKSkmZmZhYWFbGxsdnZ2pqamsLCwkZGRjY2Nf39/oqKioKCghoaGpKSkjY2NmZmZm5ubbGxsf39/kZGRo6Ojqamprq6up6enm5ubo6OjoaGhl5eXpqamkZGRkpKSi4uLfHx8d3d3dXV1mZmZj4+PjY2Nk5OTkJCQfHx8X19fmZmZq6uroqKio6Ojnp6ep6eni4uLi4uLi4uLe3t7b29vi4uLmZmZgoKCmJiYk5OTmZmZoaGhnp6eoqKinp6elJSUkJCQlJSUo6OjjY2Nra2tlpaWmpqajY2NgICAf39/iYmJkZGRn5+fmpqakpKSlpaWgoKCkJCQlpaWlpaWpqammpqaqampv7+/lJSUoqKigICAl5eXlpaWoqKig4ODpqamm5ubm5ubgoKCiIiIi4uLf39/i4uLmpqaeXl5dnZ2mZmZkZGRn5+fioqKjY2NlJSUlpaWnp6eZ2dnenp6fX19iIiIioqKjY2Nl5eXoqKilpaWgoKCm5ubjIyMnJycoKCglpaWmJiYoKCgn5+fnp6ek5OTjIyMeXl5l5eXhoaGjIyMiIiIhYWFn5+fra2tgoKCjY2NmZmZkJCQlpaWlpaWi4uLl5eXnp6emJiYioqKjIyMoqKij4+Pk5OTkpKSoqKijY2NmZmZi4uLg4ODk5OTdnZ2dHR0oKCgqqqqi4uLd3d3c3Nzf39/jY2NmZmZhISEk5OTnJycdnZ2aWlpZmZmjY2Nl5eXmpqasbGxnp6enp6ef39/goKCkZGRi4uLmJiYrKysrKysiIiIi4uLoaGhioqKfHx8jY2NfX19jIyMjIyMa2traGhohoaGpKSkn5+ffHx8gICAg4ODgICAqqqqpqamjIyMl5eXmZmZq6urlJSUgICAb29vgICAoaGhn5+foqKijY2NiIiIeXl5m5ubhoaGlpaWoaGhk5OTi4uLiIiIgICAra2tlpaWn5+fo6OjgICAdXV1mpqaiIiIfX19j4+PoaGhk5OTlpaWlpaWiIiIkZGRi4uLi4uLhoaGkZGRqampkJCQlJSUoaGhhISElpaWhYWFgICAd3d3k5OTfHx8enp6oaGhl5eXdHR0nJyclpaWgICAm5ubi4uLf39/oKCgsrKydXV1d3d3mpqapKSkhYWFX19fa2trkpKSkpKSpKSkj4+PhoaGhoaGoKCgqampn5+ffHx8dHR0hYWFdHR0mJiYz8/PtLS0iYmJlpaWoaGhj4+Pi4uLhISEpqamlJSUgoKCl5eXe3t7f39/lpaWmpqaf39/jY2NeXl5oqKimZmZi4uLhoaGhoaGmpqakZGRm5ubiYmJenp6d3d3g4ODd3d3kZGRmJiYjIyMcnJyk5OTsbGxa2triIiImpqaf39/p6enoqKiioqKe3t7np6eoKCgdnZ2cnJycnJydnZ2o6Ojl5eXqKionp6ej4+PfHx8dXV1gICAjY2NioqKdnZ2dnZ2oqKinp6etLS0wMDApKSkt7e3mZmZmZmZjY2NmZmZjY2NioqKi4uLlpaWm5ubnp6eoaGhhISEj4+PmZmZrKysm5ubioqKfHx8j4+PnJycj4+Pm5ubc3NzZ2dnhoaGgoKCmJiYi4uLkpKSkJCQaWlphYWFnJycgICAmpqarq6ul5eXpqamt7e3l5eXhISEfX19ubm5e3t7ZGRkkpKShoaGlpaWoKCgoaGhfX19aGhoiYmJiIiIp6enoqKiYWFhbW1tpKSkt7e3rq6upqammJiYqamptbW1oqKii4uLl5eXi4uLgICAkpKSl5eXm5ubkpKSkJCQjIyMjY2NkpKSl5eXi4uLe3t7d3d3hoaGjIyMl5eXhoaGiIiIgoKCbm5upqamlJSUdHR0fX19m5ube3t7eXl5mJiYqKiokpKSmJiYs7OzoqKinJycqKion5+fcHBwfX19k5OTp6enj4+PkZGReXl5kZGRl5eXrKysiIiIhYWFkZGRhYWFn5+fqqqqj4+PoaGhXl5ei4uLqqqqqqqqra2tsrKyoaGhioqKiIiIfHx8i4uLj4+Pn5+foaGhj4+PkpKSlpaWiIiIgICAdXV1i4uLdXV1hoaGl5eXl5eXnJycjY2NmJiYkpKSlpaWiYmJiIiIlpaWjY2Ni4uLjIyMoaGhlJSUmZmZpKSkfX19fX19tbW1jIyMpqamgoKCoqKiqamphYWFnJycaGhoenp6f39/p6enkpKSeXl5lJSUi4uLf39/hISEl5eXoKCgn5+fp6enl5eXi4uLs7OztLS0j4+PlJSUlpaWnp6elJSUmpqaioqKkJCQj4+PmZmZoqKii4uLe3t7hYWFZWVlfHx8hISEhYWFjY2Ni4uLoaGhsLCwhISEenp6goKCiYmJoqKik5OTmJiYj4+PhISElJSUmpqac3NzhoaGd3d3j4+PdHR0oqKiuLi4ioqKsrKym5ubmZmZiYmJf39/ioqKn5+fkJCQiYmJl5eXhISEf39/pKSkp6enqKiooaGhmpqaenp6qamppKSkmJiYY2NjoaGhoaGhmpqakZGRl5eXoqKioKCgnp6el5eXlYWF+yEh/wAA/wAA/wAA/wAA/wAA/ggI7TMzu3x8ioqKkpKS3VhY/wAA/wAA/gYGpm1tlpaWkpKSoICA/RER/wAA/wAA50pKiYmJoYGB/A0N/wAA/wAA/wAA/wAA1IGBp6eniIiIkZGRgoKCgICAkJCQrq6umpqara2tl5eXhoaGrKyskpKShYWFhYWFmZmZq6urkpKShYWFra2ts7OznJycjY2Nb29vk5OTo6Ojj4+PfX19sbGxnJycj4+PlJSUnp6egoKCyVJSsV5eioqKhISEb29vpKGhsHx88CoqtXp6mpqaiYmJz1RUu3t7oqKio6OjjY2Nb29vdnZ2hoaGmGRk3VBQl5eXkZGRd3d3kZGR3mZmrHl5k5OTmZmZjY2NhISEfX19jY2NkpKSnp6ednZ2ra2to6OjlpaWioqKfX19mpqap6enkpKSlpaWk5OTpqamn5+fjIyMhYWFtbW1srKyhISEcnJymJiYgoKClJSUoKCgiYmJn5+fqqqqoKCgbW1tdXV10mpqu3JyhISEhYWFg4ODc3NzjY2Nqn195D4+i4uLg4OD2GxswoaGi4uLd3d3o6Oji4uLenp6e3t7sYmJ2T8/fX19mJiYpKSkhoaG32hoqnZ2hoaGc3NzjIyMi4uLe3t7fX19z8/PoqKid3d3bGxso6Ojnp6ehISEgICAg4ODeXl5o6OjoKCgoKCgmZmZkpKSoqKiiIiIeXl5np6eoqKilpaWiYmJoqKijIyMl5eXpKSkkJCQlpaWn5+fg4ODg4OD0WhovXV1eXl5gICAfHx8iIiIm5ubjYyM8UNDhoaGioqK0Vtbunp6hoaGcHBwhYWFj4+PiYmJeXl5pnp642Jij4+PhoaGmZmZgoKC1EdHsoKCiYmJenp6fX19lpaWlJSUkJCQmJiYx8fHmpqac3NzoaGhoKCgk5OTgICAiIiIj4+Prq6uhISEfX19qampq6ursLCwhYWFfHx8iIiIqqqqkpKSoKCgmZmZlJSUgICAm5ubpqamlJSUi4uLiYmJlJSUzl5esl9fioqKdnZ2nJyck5OTjY2NyJOT4l9fgICAdXV10FdXrmJidnZ2hoaG1Tw860ZGkZGRgICAt5KS5mxsl5eXb29venp6d3d300NDpGxsn5+fpqamjIyMq6uro6Ojk5OTioqKkJCQsbGxtLS0gICAj4+Ppqamnp6ee3t7hISEoqKioKCgkZGRmJiYkJCQqKioenp6ioqKhYWFmJiYtLS0iIiImpqapKSkkJCQnp6eoKCgnp6ek5OTgoKCjY2N0Whosl9ffHx8m5ubnZqaoomJx25u9EhIk25ukZGRkpKSzlJSrWFh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pqamhISEg4ODgICAjIyMmJiYenp6oqKimZmZk5OTf39/hYWFhYWFj4+Pl5eXsrKyl5eXlJSUenp6fHx8hYWFhoaGfHx8mJiYsLCwkJCQeXl5dHR0goKCfHx8eXl5dnZ2j4+Pi4uLhoaGnJycp6enk5OTnJycg4ODfX19kZGRmpqalJSUpqamsbGxsrKyqqqqo6OjkpKSmJiYioqKo6Ojj4+PiIiIqqqqlJSUrKysqqqqoqKik5OTrq6up6enoKCgoaGhcnJyhoaGjY2NioqKmJiYj4+PiYmJeXl5i4uLj4+PlpaWn5+fn5+fjIyMm5ubnp6ef39/hYWFbm5ugICAkpKSq6urpKSkkZGRkJCQcnJyb29vdXV1g4ODgICAhoaGioqKlpaWmZmZfHx8f39/hoaGkZGRkpKSjY2NgoKCjIyMoKCgkpKSpqamqqqqn5+flJSUp6enjY2NlJSUl5eXjY2NpKSkmpqaj4+PmZmZoaGhwMDAoaGhoqKiqampf39/goKCi4uLkJCQiYmJjY2NkJCQi4uLlpaWaWlpf39/m5ubpqamoKCgoKCgmJiYc3Nzb29vjIyMiIiIgICAk5OTmZmZk5OThISEg4ODeXl5dnZ2hISEdXV1b29vY2NjjY2NlpaWpKSkl5eXiYmJbW1taGhonJyco6OjjIyMkZGRpqamkpKSpqamn5+fpKSkpKSkqqqqs7OzmZmZfX19hoaGk5OTkpKSg4ODfX19jIyMlJSUsrKyqqqqnp6ekpKSjIyMoKCgeXl5jY2NoKCgmpqadHR0np6ep6enhISEe3t7np6evLy8mpqag4ODb29vioqKiIiIf39/pKSkk5OTfHx8YWFhYWFhf39/aGhogICAhISEmJiYqKiokJCQa2trhISEhYWFkJCQi4uLjIyMfX19j4+PiYmJnJycmpqaoKCgkZGRkpKSlpaWrq6umJiYm5ubqampoKCgn5+fm5ubl5eXiYmJjIyMoaGhi4uLiYmJf39/oaGhnJyck5OTqampjY2No6OjlJSUgICAq6uri4uLgICAgICAqqqqj4+Pnp6eioqKjY2NoaGhnp6eo6OjqamphYWFiYmJkJCQk5OTjIyMbW1tY2NjhoaGfHx8b29vhoaGioqKsLCwlpaWnJycjIyMbGxsaWlpjY2Nb29vmZmZqKiol5eXhYWFlpaWeXl5goKCqqqqoqKiioqKmpqahYWFlpaWtra2oKCgmZmZm5ubra2tk5OTi4uLkZGRjY2Nj4+PioqKnJycnp6ekJCQkJCQe3t7kJCQmJiYcHBwl5eXkZGRjIyMj4+Pq6urnp6eg4ODi4uLkJCQrq6unJycj4+PgoKCgICAgoKCp6enn5+fjIyMhISEcnJyY2NjcnJyd3d3e3t7mpqam5ubm5ubn5+ff39/aWlpeXl5i4uLj4+Pk5OTlJSUlJSUjIyMjY2NjIyMoKCgmpqajIyMmZmZlpaWkZGRm5ubmZmZl5eXs7OzsrKyhYWFlJSUlJSUlJSUlpaWn5+foKCgg4ODnJycoaGhlJSUiIiIl5eXdHR0fX19n5+flJSUe3t7jIyMkpKSmZmZm5ubXV1dfX19goKCdHR0lpaWhoaGnJyckZGRp6enjY2Nj4+PdXV1goKCf39/kJCQe3t7goKCmJiYiIiIhoaGoqKipKSkeXl5b29vcnJyg4ODkJCQkJCQmpqao6Ojj4+PkZGRlJSUkJCQpKSkpqamnp6enp6enp6eg4ODhoaGlJSUmpqai4uLnJyck5OTlpaWmJiYiIiIkZGRn5+foKCgm5ubj4+PhoaGkpKSi4uLk5OTkZGRiYmJmZmZkJCQo6OjkpKSjIyMbGxsZWVljIyMp6enpKSkhYWFbGxsgoKChISEkJCQnp6efHx8hISEhoaGmJiYjIyMiIiIioqKi4uLfX19mpqaoKCgiIiId3d3hISEi4uLhoaGkZGRoqKik5OThoaGlJSUmJiYoKCgn5+fmZmZm5ubl5eXj4+PhYWFjIyMjIyMoaGhmZmZqqqqn5+fmZmZhYWFnp6eoaGhiIiIjIyMlJSUk5OTqqqqmJiYfX19hoaGn5+fjY2NkJCQoKCgnJyckpKSkZGRg4ODgICAfX19i4uLioqKiYmJcHBwjIyMmpqag4ODhYWFkJCQgoKCrKysk5OTg4ODkZGRj4+Pj4+Pk5OToaGho6OjkpKSdHR0TU1NhISEhoaGmpqaqqqqrq6ulJSUn5+foaGhk5OTmpqamJiYhoaGhoaGm5ublJSUq6urmpqaqqqqtLS0l5eXkZGRqKioqqqqkJCQjIyMkJCQiIiInJyciYmJn5+fl5eXlpaWmpqao6OjpqamjIyMhoaGlJSUenp6c3NziIiIfX19U1NTdXV1k5OTl5eXkZGRmJiYk5OTmZmZenp6ioqKkJCQkJCQf39/k5OTlJSUkZGRenp6XV1ddXV1lpaWl5eXf39/iIiIhoaGeXl5hoaGpKSktbW1p6eniYmJgICAjIyMmZmZnp6ehYWFkZGRrq6uoqKilpaWjY2Nm5ubra2tsLCwm5ubwMDAnJycoqKik5OTiIiIf39/kpKSfX19jIyMoqKinp6eqKiokZGRtbW1oqKiioqKp6eng4ODkJCQm5ubfX19fX19hoaGkZGRoKCglpaWl5eXnJychoaGiIiIkZGRc3NzeXl5i4uLjY2NkZGRfX19a2trY2NjfHx8mJiYs7Ozk5OTioqKeXl5fHx8mJiYi4uLoaGhp6enlpaWhYWFkpKSnp6empqalpaWiIiIjIyMnJyckZGRq6ursrKytbW1tra2ycnJqamplJSUenp6kZGRfX19ioqKjIyMkZGRmJiYlJSUn5+foaGhsbGxp6enkJCQfX19jY2NjIyMjIyMn5+fnJycZmZmeXl5rKysj4+Pe3t7o6OjmJiYiIiIbW1te3t7hISEjY2NeXl5iYmJioqKbW1tdHR0g4ODlJSUfHx8lJSUlJSUkJCQY2NjhISEjY2Nmpqam5ublJSUlJSUmpqal5eXmJiYmZmZmpqalJSUmJiYqKios7Oztra2tra2wMDAsrKyqampk5OTlpaWlpaWj4+Pf39/hoaGjIyMmZmZmpqap6enn5+fl5eXlpaWkJCQn5+ffHx8dXV1g4ODmZmZqKiomJiYnp6ehYWFmZmZmpqagICAhISEkZGRbW1tf39/j4+PfX19dnZ2cHBwmZmZoKCgi4uLiYmJdnZ2Y2NjlJSUlpaWmJiYjIyMiYmJjIyMj4+PfHx8hoaGlJSUioqKlJSUjIyMnJycq6urnJycm5ubsbGxrq6ura2tnJycoKCgubm5qampmZmZg4ODhoaGjY2NkZGRgICAnJyclpaWsLCwk5OTl5eXnp6ehISEioqKhYWFnp6edXV1gICAsrKynJycqqqqk5OTenp6hISEenp6d3d3cnJyhYWFioqKdHR0goKCjIyMkZGReXl5iIiIioqKk5OTd3d3hISEjY2Ni4uLkpKSqKionJycnJycjY2NgICAf39/iYmJcnJyjIyMmpqaoKCglpaWkJCQmJiYm5ubnJychoaGo6OjjIyMmZmZsrKytbW1sLCwg4ODcnJynJycjIyMc3Nzo6OjoaGhjY2NsrKyoqKilJSUgICAoKCgm5ubsbGxnJycpKSkq6urfHx8hISEi4uLg4ODgICAf39/dXV1eXl5aGhooKCgo6OjhoaGfHx8e3t7i4uLYWFhj4+Pe3t7urq6k5OTioqKfX19i4uLq6uruLi4k5OTfX19kZGRioqKhoaGeXl5hoaGe3t7o6OjqKioeXl5i4uLm5ubm5ubfX19j4+Pm5ubkZGRkZGRoaGhd3d3d3d3aGhoXFxciIiIhoaGmZmZnp6egoKCk5OTqKiokZGRbW1t",
    "width": 64,
    "height": 48
}

if (typeof atob !== 'function') {
    function atob(data) {
        // Base64 decode directly to Uint8Array
        return Duktape.dec('base64', data);
    }
}

function createTextureFromRawRgbBase64Data(width, height, base64Data) {
    var binary = atob(base64Data);
    var typedArray = binary;

    if (typeof binary === 'string') {
        typedArray = new Uint8Array(new ArrayBuffer(binary.length));
        for(var i = 0; i < binary.length; i++) {
            typedArray[i] = binary.charCodeAt(i);
        }
    }

    if (gl.isTexture(null) == true) {
        throw "null texture should be false";
    }

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (gl.isTexture(texture) == false) {
        throw "texture should exist";
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, typedArray, 0);

    gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
}

function loadShader(type, source) {
    if (gl.isShader(null) == true) {
        throw "null shader should be false";
    }

    var shader = gl.createShader(type);
    if (gl.isShader(shader) == false) {
        throw "shader should exist";
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
        throw gl.getShaderInfoLog(shader);
    }

    if (gl.getShaderParameter(shader, gl.SHADER_TYPE) !== type) {
        throw "Shader type not expected!"; 
    }

    return shader;
}

function makeProgram(vertexShader, fragmentShader) {
    if (gl.isProgram(null) == true) {
        throw "null program should be false";
    }

    var program = gl.createProgram();
    if (gl.isProgram(program) == false) {
        throw "program should exist";
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
        throw gl.getProgramInfoLog(program);
    }

    var attachedShaders = gl.getProgramParameter(program, gl.ATTACHED_SHADERS);
    if (attachedShaders !== 2) {
        throw "Expected program to have two(2) attached shaders. actual: " + attachedShaders;
    }

    return program;
}

function init() {
    // will define custom variable glsl_version to make GLSL compatible between OpenGL core and OpenGL ES
    var glsl_version = '300 es';
    if (typeof BOOTSTRAP_GLSL_VERSION === 'string') {
        // If you end up with errors like: "GLSL 3.20 is not supported. Supported versions are: 1.10, 1.20, 1.30, 1.00 ES, and 3.00 ES"
        // Then you should customize BOOTSTRAP_GLSL_VERSION to fit your need, or customize the shader code
        glsl_version = BOOTSTRAP_GLSL_VERSION;
    }

    // cross-platform (browser vs. Duktape) initialize WebGL 2
    if (typeof Duktape !== 'undefined') {
        // Duktape
        gl = new WebGL2RenderingContext();
    } else if (typeof document !== 'undefined') {
        // HTML5
        var canvas = document.getElementById("screen");
        gl = canvas.getContext("webgl2");
    }

    if (!gl || !(gl instanceof WebGL2RenderingContext)) {
        throw 'WebGL2 not initialized';
    }

    var vertexIndex = 0;
    var texCoordIndex = 1;

    // compile vertex shader
    var vertexShaderSource = "";
    vertexShaderSource += "#version " + glsl_version + "\n";
    vertexShaderSource += "#ifdef GL_ES\n";
    vertexShaderSource += "    precision mediump float;\n";
    vertexShaderSource += "#endif\n";
    vertexShaderSource += "layout(location = " + vertexIndex + ") in vec3 vertexPosition;\n";
    vertexShaderSource += "layout(location = " + texCoordIndex + ") in vec2 vertexTexCoord;\n";
    vertexShaderSource += "out vec2 texCoord;\n";
    vertexShaderSource += "void main() {\n";
    vertexShaderSource += "    texCoord = vertexTexCoord;\n";
    vertexShaderSource += "    gl_Position.xyz = vertexPosition;\n";
    vertexShaderSource += "    gl_Position.w = 1.0;\n";
    vertexShaderSource += "}\n";

    vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);

    // compile fragment shader
    var textureUniformName = "texture0";

    var fragmentShaderSource = "";
    fragmentShaderSource += "#version " + glsl_version + "\n";
    fragmentShaderSource += "#ifdef GL_ES\n";
    fragmentShaderSource += "    precision mediump float;\n";
    fragmentShaderSource += "#endif\n";
    fragmentShaderSource += "uniform sampler2D " + textureUniformName + ";\n";
    fragmentShaderSource += "in vec2 texCoord;\n";
    fragmentShaderSource += "out vec4 fragColor;\n";
    fragmentShaderSource += "void main() {\n";
    fragmentShaderSource += "    fragColor = texture(" + textureUniformName + ", texCoord) * vec4(texCoord.x, texCoord.y, 1.0, 1.0);\n";
    fragmentShaderSource += "}\n";

    fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    // create shader program and link compiled shaders to it

    program = makeProgram(vertexShader, fragmentShader);

    // Check that shader program uniform count and information is correct
    if (gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) != 1) {
        throw "Shader uniform count should be 1";
    }
    var activeInfo = gl.getActiveUniform(program, 0);
    if (activeInfo.type != gl.SAMPLER_2D || activeInfo.name != textureUniformName || activeInfo.size != 1) {
        throw "Uniform active info incorrect! " + JSON.stringify();
    }
    var uniformLocation = gl.getUniformLocation(program, activeInfo.name);
    if (uniformLocation === null || uniformLocation === void null) {
        throw "Uniform location is incorrect??? " + uniformLocation;
    }

    if (gl.getUniformLocation(program, "notexistinguniform") !== null) {
        throw "Expecting null for non-existing uniform location";
    }

    // Check that shader program attribute count and information is correct
    if (gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) != 2) {
        throw "Shader attribute count should be 2";
    }
    activeInfo = gl.getActiveAttrib(program, 0);
    if (activeInfo.type != gl.FLOAT_VEC3 || activeInfo.name != 'vertexPosition' || activeInfo.size != 1) {
        throw "Attrib active info incorrect! " + JSON.stringify();
    }
    activeInfo = gl.getActiveAttrib(program, 1);
    if (activeInfo.type != gl.FLOAT_VEC2 || activeInfo.name != 'vertexTexCoord' || activeInfo.size != 1) {
        throw "Attrib active info incorrect! " + JSON.stringify();
    }
    var attribLocation = gl.getAttribLocation(program, activeInfo.name);
    if (attribLocation === null || attribLocation === void null) {
        throw "Attrib location is incorrect??? " + attribLocation;
    }

    if (gl.getAttribLocation(program, "notexistingattrib") !== -1) {
        throw "Expecting -1 for non-existing attrib location";
    }

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, textureUniformName), 0);

    // vertex array
    if (gl.isVertexArray(null) == true) {
        throw "null vertex array should be false";
    }

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    if (gl.isVertexArray(vao) == false) {
        throw "vertex array should exist";
    }

    // create vertex buffer object

    var vboData = new Float32Array([
        /* vertex x,y,z */  /* texcoord x,y */
        -1.0,  1.0,  0.0,   0.0, 2.0,   
        -1.0, -1.0,  0.0,   0.0, 0.0,
         1.0,  1.0,  0.0,   2.0, 2.0,
         1.0, -1.0,  0.0,   2.0, 0.0
    ]);

    vboIndices = new Uint8Array([0, 1, 2, 3]);

    if (gl.isBuffer(null) == true) {
        throw "null buffer should be false";
    }

    vbo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    if (gl.isBuffer(vbo) == false) {
        throw "buffer should exist";
    }
    gl.bufferData(gl.ARRAY_BUFFER, vboData, gl.DYNAMIC_DRAW, 0);

    var typeByteSize = vboData.byteLength / vboData.length;

    gl.enableVertexAttribArray(vertexIndex);
    gl.vertexAttribPointer(vertexIndex, 3, gl.FLOAT, false, typeByteSize * (3 + 2), 0);

    gl.enableVertexAttribArray(texCoordIndex);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, typeByteSize * (3 + 2), typeByteSize * 3);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vboIndices, gl.DYNAMIC_DRAW, 0);

    gl.activeTexture(gl.TEXTURE0);

    texture = createTextureFromRawRgbBase64Data(img.width, img.height, img.data);
}

function draw() {
    // clear screen and draw image
    gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLE_STRIP, vboIndices.length, gl.UNSIGNED_BYTE, 0);
}

function cleanup() {
    // do the cleanup
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindVertexArray(null);


    if (texture) {
        gl.deleteTexture(texture);
    }

    if (vertexShader) {
        gl.deleteShader(vertexShader);    
    }
    
    if (fragmentShader) {
        gl.deleteShader(fragmentShader);
    }
    
    if (program) {
        gl.deleteProgram(program);
    }
    
    if (vbo) {
        gl.deleteBuffer(vbo);
    }
    
    if (indexBuffer) {
        gl.deleteBuffer(indexBuffer);
    }

    if (vao) {
        gl.deleteVertexArray(vao);
    }
}
