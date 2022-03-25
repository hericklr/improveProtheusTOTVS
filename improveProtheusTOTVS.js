/*

improveProtheusTOTVS v1.2.0
https://github.com/hericklr/improveProtheusTOTVS

*/
(

  ()=>
  {

    'use strict';

    const

// ALMOST A JQUERY IMITATION (VERY ULTRA SLIM)

      // RETURNS AN ELEMENT FROM WITHIN THE MAIN FRAME
      $1=
        (rules='')=>
        {
          return document.
            getElementById('mybcontainer_iframe').
            contentDocument.
            getElementById('principal').
            contentDocument.querySelector(rules.trim());
        },

      // RETURNS AN NODELIST FROM WITHIN THE MAIN FRAME
      $n=
        (rules='')=>
        {
          return document.
            getElementById('mybcontainer_iframe').
            contentDocument.
            getElementById('principal').
            contentDocument.querySelectorAll(rules.trim());
        },

// DATE AND TIME SUPPORT FUNCTIONS

      // CONVERTS A DATE TEXT FROM DD/MM/YY FORMAT TO YYYY-MM-DD
      normalizeDate=
        (date='')=>
        {
          if(date==='')
          {
            return '1970-01-01';
          }
          if(date.indexOf('/')>-1)
          {
            date=date.split('/').reverse();
            if(date[0].length===2)
            {
              date[0]=`20${date[0]}`;
            }
            date=date.join('-')
          }
          return date;
        },

      // CONVERTS A TIME TEXT FROM HH:MM FORMAT TO HH:MM:SS
      normalizeTime=
        (time='')=>
        {
          if(time==='')
          {
            return '00:00:00';
          }
          time=time.replace(/\D+/g,'');
          if(time.length!==4)
          {
            return '00:00:00';
          }
          return time.replace(/(\d{2})(\d{2})$/,'$1:$2:00');
        },

      // CONVERTS A TIME TO DATETIME WITH ZERO AS TIMEZONE
      timeToDatetime=
        time=>
        {
          return new Date(`1970-01-01T${time}+0000`);
        },

      // CONVERTS A TIME IN MILLISECONDS TO HH:MM FORMAT
      millisecondsToHourMinute=
        milliseconds=>
        {
          let
            seconds=Math.floor(milliseconds/1000),
            minutes=Math.floor(seconds/60),
            hours=Math.floor(minutes/60);
          minutes=minutes%60;
          hours=hours.toString().padStart(2,'0');
          minutes=minutes.toString().padStart(2,'0');
          return `${hours}:${minutes}`;
        },

      // CONVERTS HOURS AND MINUTES OF A DATETIME TO INTEGER REPRESENTATION
      hourMinuteFromDatetimeToInteger=
        datetime=>
        {
          return parseInt(
            datetime.
              toISOString().
              substring(11,16).
              replace(':',''),
              10
          );
        },

// PROCEDURE FUNCTIONS (SOUNDS LIKE "PROCEDURE DIVISION" OF COBOL)

      // ADD NEW RULES TO MAIN FRAME CSS
      addNewStyles=
        ()=>
        {
          const
            newStyles=$1('head').appendChild(document.createElement('style'));
          newStyles.innerHTML=
            'table tbody tr:hover{background:#ebebeb}'+
            'table tbody tr:nth-child(2n+1):hover{background:#e5e5e5}'+
            '.out-of-bounds{color:#f00}';
        },

      // ADD A BUTTON TO CALL THE TIME LIMIT RESET ROUTINE
      addButtonToAdjustLimits=
        ()=>
        {
          $1('#filterMarks').insertAdjacentHTML(
            'beforeend',
            '<input name="btnAjustaLimites" id="btnAjustaLimites" type="button" value="Ajusta Limites">'
          );
          $1('#btnAjustaLimites').addEventListener(
            'click',
            requestNewLimitsAndApply
          );
        },

      // ROUTINE TO REQUIRE THE TWO NEW LIMITS AND APPLY TO THE SUMMARY COLUMN
      requestNewLimitsAndApply=
        ()=>
        {

          const

            // VALIDATE AND TREAT THE LIMIT TIME FOR WEEKDAYS AND SATURDAYS
            processTime=
              (field='',time='')=>
              {
                field=field.trim();
                if(field==='')
                {
                  return {
                    error: true,
                    message: 'Campo em análise não fornecido'
                  };
                }
                time=time.replace(/[^\d\:]+/g,'');
                if(time.trim()==='')
                {
                  return {
                    error: true,
                    message: `É necessário fornecer o limite de horas para os ${field}`
                  };
                }
                if(time.length>5)
                {
                  time=time.substring(0,4);
                }
                time=time.split(':');
                switch(time.length)
                {
                  case 1:
                    time.push('0');
                    break;
                  case 2:
                    break;
                  default:
                    return {
                      error: true,
                      message: `Limite de horas para ${field} fornecido está em formato incorreto`
                    };
                }
                time=time.map(content=>parseInt(content,10));
                if(time[0]===NaN || time[0]>11)
                {
                  return {
                    error: true,
                    message: `Horas fornecidas para o limite de horas para os ${field} precisa ser de 0 a 11`
                  };
                }
                if(time[1]===NaN || time[1]>59)
                {
                  return {
                    error: true,
                    message: `Minutos fornecidos para o limite de horas para os ${field} precisa ser de 0 a 59`
                  };
                }
                time=
                  time.
                  map(content=>content.toString().padStart(2,'0')).
                  join(':');
                return {
                  error: false,
                  date: `1970-01-01T${time}:00+0000`
                };
              };

          let

            newWeekdayHoursLimit,
            newSaturdayHourslimit,
            tmp;

          newWeekdayHoursLimit=
            prompt(
              'Limite de horas para dias de semana (HH:MM)\nMáximo de 11:59',
              hoursLimit.weekday.toISOString().substring(11,16)
            );

          if(newWeekdayHoursLimit===null)
          {
            return;
          }

          newSaturdayHourslimit=
            prompt(
              'Limite de horas para sábados (HH:MM)\nMáximo de 11:59',
              hoursLimit.saturday.toISOString().substring(11,16)
            );

          if(newSaturdayHourslimit===null)
          {
            return;
          }

          tmp=
            processTime(
              'dias de semana',
              newWeekdayHoursLimit
            );
          if(tmp.error)
          {
            alert(tmp.message);
            return;
          }
          newWeekdayHoursLimit=tmp.date;

          tmp=
            processTime(
              'sábados',
              newSaturdayHourslimit
            );
          if(tmp.error)
          {
            alert(tmp.message);
            return;
          }
          newSaturdayHourslimit=tmp.date;

          hoursLimit=
            {
              weekday: new Date(newWeekdayHoursLimit),
              saturday: new Date(newSaturdayHourslimit)
            };

          marksOutOfBoundsData();

        },

      // CHANGE TD SIZE WITH COLSPAN
      resizeTableTitle=
        ()=>
        {
          tableTitle.setAttribute('colspan',totalColumns+1);
        },

      // INSERT THE NEW COLUMN WITH THE SUMMARY OF THE HOURS WORKED ON THE DAY
      addSumColumnToTable=
        ()=>
        {

          let
            dayOfWeek,
            totalTime,
            totalTimeAsDatetime,
            html;

          for(let tr of $n('table > tbody > tr'))
          {
            switch(tr.rowIndex)
            {
              case 0:
                continue;
              case 1:
                tr.children[newCellPosition].insertAdjacentHTML('afterend','<th width="30">Total</th>');
                continue;
              default:
                dayOfWeek=normalizeDate(tr.children[0].textContent);
                dayOfWeek+='T00:00:00+0000';
                dayOfWeek=new Date(dayOfWeek);
                dayOfWeek=dayOfWeek.getDay();
                totalTime=0;
                for(let i=0;i<timeColumnPairs;++i)
                {
                  if(tr.children[(2*i)+2].textContent.trim()==='')
                  {
                    continue;
                  }
                  totalTime+=
                    timeToDatetime(
                      normalizeTime(tr.children[(2*i)+3].textContent)
                    )-timeToDatetime(
                      normalizeTime(tr.children[(2*i)+2].textContent)
                    );
                }
                totalTimeAsDatetime=new Date(totalTime);
                html='<td class="info-cent" data-time="';
                if(totalTime===0)
                {
                  html+='0';
                }
                else
                {
                  html+=hourMinuteFromDatetimeToInteger(totalTimeAsDatetime);
                }
                html+='" data-dow="'+dayOfWeek+'">';
                if(totalTime===0)
                {
                  html+='&nbsp;';
                }
                else
                {
                  html+=millisecondsToHourMinute(totalTime);
                }
                html+='</td>';
                tr.children[newCellPosition].insertAdjacentHTML('afterend',html);
                break;
            }
          }

        },

      // CHANGES THE COLOR OF HOURS THAT ARE BELOW THE SET LIMITS
      marksOutOfBoundsData=
        ()=>
        {

          const
            cssNewCellPosition=newCellPosition+2,
            hoursLimitWeekday=
              hourMinuteFromDatetimeToInteger(hoursLimit.weekday),
            hoursLimitSaturday=
              hourMinuteFromDatetimeToInteger(hoursLimit.saturday);
          let
            classList,
            timeAsInteger;
          for(let td of $n(`table > tbody > tr > td:nth-of-type(${cssNewCellPosition})`))
          {
            if(td.parentElement.rowIndex<2)
            {
              continue;
            }
            timeAsInteger=parseInt(td.getAttribute('data-time'),10);
            classList=['info-cent'];
            if(
              timeAsInteger>0 &&
              (
                (
                  td.getAttribute('data-dow')!=='5' &&
                  timeAsInteger<hoursLimitWeekday
                )
                ||
                (
                  td.getAttribute('data-dow')==='5' &&
                  timeAsInteger<hoursLimitSaturday
                )
              )
            )
            {
              classList.push('out-of-bounds');
            }
            td.setAttribute('class',classList.join(' '));
          }

        },

      tableTitle=$1('table > tbody > tr:nth-of-type(1) > th:nth-of-type(1)'),

      totalColumns=parseInt(tableTitle.getAttribute('colspan'),10),

      timeColumnPairs=(totalColumns-5)/2,

      newCellPosition=totalColumns-4;

    let

      hoursLimit=
        {
          weekday: new Date('1970-01-01T05:30:00+0000'),
          saturday: new Date('1970-01-01T03:00:00+0000')
        };

// INHIBIT MORE THAN ONE EXECUTION

    if($1('body').hasAttribute('improved'))
    {
      return;
    }

// RUN, FORREST, RUN!

    addNewStyles();

    addButtonToAdjustLimits();

    resizeTableTitle();

    addSumColumnToTable();

    marksOutOfBoundsData();

    $1('body').setAttribute('improved','yep');

  }

)()