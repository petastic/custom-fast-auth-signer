import * as React from 'react';
import ArrowDownSvg from '../../Images/arrow-down';
import ArrowUpSvg from '../../Images/arrow-up';
import InfoSvg from '../../Images/info';
import TableContentWrapper from './TableContent.styles';
import { Tooltip } from '../../lib/Tooltip';
import { Button } from '../../lib/Button';
import OpenLinkSvg from '../../Images/open-link';

interface TableContentProps {
  hasFunctionCall?: boolean;
  isFunctionCallOpen?: boolean;
  currencyValue?: string;
  functionDesc?: any;
  leftSide?: string;
  rightSide?: string;
  infoText?: string;
  openLink?: string;
}
function TableContent({
  hasFunctionCall,
  isFunctionCallOpen,
  functionDesc,
  leftSide,
  rightSide,
  currencyValue,
  infoText,
  openLink,
}: TableContentProps) {
  const [methodDetails, setMethodDetails] = React.useState(false);

  return (
    <TableContentWrapper hasFunctionCall={hasFunctionCall}>
      <div className="left-side">
        {leftSide}
        {infoText && (
          <Tooltip infoText={infoText}>
            <InfoSvg />
          </Tooltip>
        )}
        {openLink && <a href={openLink} target="_blank" rel="noreferrer"><OpenLinkSvg /></a>}
      </div>

      <div className="right-side">
        {hasFunctionCall ? (
          <div className="button function-call">
            <Button
              type="button"
              size="small"
              onClick={() => setMethodDetails(!methodDetails)}
            >
              {rightSide}{' '}
              {isFunctionCallOpen && methodDetails ? (
                <ArrowUpSvg />
              ) : (
                <ArrowDownSvg />
              )}
            </Button>
          </div>
        ) : (
          <div>
            {rightSide}
            {currencyValue ? <small>{currencyValue}</small> : null}
          </div>
        )}
      </div>
      {isFunctionCallOpen && functionDesc && methodDetails ? (
        <div className="function-desc">{functionDesc}</div>
      ) : null}
    </TableContentWrapper>
  );
}

export default TableContent;