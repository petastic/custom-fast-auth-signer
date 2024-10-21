import styled from 'styled-components';

const FormContainer = styled.form<{ inIframe?: boolean; className?: string }>`
  width: 375px;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  header {
    text-align: center;

    h1 {
      font: var(--text-xl);
      font-weight: bold;
    }

    .desc {
      margin-bottom: 1px;
    }

    .desc span {
      color: #706f6c;
    }
  }

  & > p {
    color: #706f6c;
    font-size: 14px;
  }

  button {
    width: 100%;
  }

  @media (min-width: 768px) {
    max-width: 380px;
  }

  ${(props) => props.inIframe && 'margin: 0;'} @media screen and (
    max-width: 767px) {
    // Height and width will be controlled by iFrame
    ${(props) => props.inIframe
      && `
        width: 100%;
        height: 100%;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      `}
  }
`;

export default FormContainer;
